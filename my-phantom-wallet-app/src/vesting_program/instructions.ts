import * as web3 from '@solana/web3.js';
import * as spl from '@solana/spl-token';
import bs58 from 'bs58';
import { ContractInfo, Schedule } from './state';
import { generateRandomSeed, Numberu32, Numberu64 } from './utils';

/**
 * The vesting schedule program ID on mainnet
 */
export const TOKEN_VESTING_PROGRAM_ID = new web3.PublicKey(
  '7goRg4PCntCSBsAKKTvajQ4aJoXqT8ZF7ciKMmxBQ4zD',
);
export const TECH_HOUSE_FEE_WALLET = new web3.PublicKey(
  "8qQKCLffmpp9415i4g6WdibjA146UMFk4MndxfWuGVZc",
);

export enum Instruction {
  Init,
  Create,
}

export interface PrepareLockReturn {
  vestingAccountKey: web3.PublicKey;
  vestingTokenAccountKey: web3.PublicKey;
  instructions: web3.TransactionInstruction[];
}

export interface GetLockReturn extends PrepareLockReturn {
  sourceTokenAccount: web3.PublicKey;
  seed: string;
}

export function   createInitInstruction(
  systemProgramId: web3.PublicKey,
  vestingProgramId: web3.PublicKey,
  payerKey: web3.PublicKey,
  vestingAccountKey: web3.PublicKey,
  seeds: Array<Buffer | Uint8Array>,
  numberOfSchedules: number,
): web3.TransactionInstruction {
  const buffers = [
    Buffer.from(Int8Array.from([0]).buffer),
    Buffer.concat(seeds),
    // @ts-ignore
    new Numberu32(numberOfSchedules).toBuffer(),
  ];

  const data = Buffer.concat(buffers);
  const keys = [
    {
      pubkey: systemProgramId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: web3.SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: payerKey,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: vestingAccountKey,
      isSigner: false,
      isWritable: true,
    },
  ];

  return new web3.TransactionInstruction({
    keys,
    programId: vestingProgramId,
    data,
  });
}

export function createCreateInstruction(
  vestingProgramId: web3.PublicKey,
  tokenProgramId: web3.PublicKey,
  vestingAccountKey: web3.PublicKey,
  vestingTokenAccountKey: web3.PublicKey,
  sourceTokenAccountOwnerKey: web3.PublicKey,
  sourceTokenAccountKey: web3.PublicKey,
  destinationTokenAccountKey: web3.PublicKey,
  mintAddress: web3.PublicKey,
  schedules: Array<Schedule>,
  seeds: Array<Buffer | Uint8Array>,
): web3.TransactionInstruction {
  const buffers = [
    Buffer.from(Int8Array.from([1]).buffer),
    Buffer.concat(seeds),
    mintAddress.toBuffer(),
    destinationTokenAccountKey.toBuffer(),
  ];

  schedules.forEach(s => {
    buffers.push(s.toBuffer());
  });

  const data = Buffer.concat(buffers);
  const keys = [
    {
      pubkey: web3.SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: tokenProgramId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TECH_HOUSE_FEE_WALLET,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: vestingAccountKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: vestingTokenAccountKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: sourceTokenAccountOwnerKey,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: sourceTokenAccountKey,
      isSigner: false,
      isWritable: true,
    },
  ];
  return new web3.TransactionInstruction({
    keys,
    programId: vestingProgramId,
    data,
  });
}

export function createUnlockInstruction(
  vestingProgramId: web3.PublicKey,
  tokenProgramId: web3.PublicKey,
  clockSysvarId: web3.PublicKey,
  vestingAccountKey: web3.PublicKey,
  vestingTokenAccountKey: web3.PublicKey,
  destinationTokenAccountKey: web3.PublicKey,
  seeds: Array<Buffer | Uint8Array>,
): web3.TransactionInstruction {
  const data = Buffer.concat([
    Buffer.from(Int8Array.from([2]).buffer),
    Buffer.concat(seeds),
  ]);

  const keys = [
    {
      pubkey: tokenProgramId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: clockSysvarId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: vestingAccountKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: vestingTokenAccountKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: destinationTokenAccountKey,
      isSigner: false,
      isWritable: true,
    },
  ];
  return new web3.TransactionInstruction({
    keys,
    programId: vestingProgramId,
    data,
  });
}

export function createChangeDestinationInstruction(
  vestingProgramId: web3.PublicKey,
  vestingAccountKey: web3.PublicKey,
  currentDestinationTokenAccountOwner: web3.PublicKey,
  currentDestinationTokenAccount: web3.PublicKey,
  targetDestinationTokenAccount: web3.PublicKey,
  seeds: Array<Buffer | Uint8Array>,
): web3.TransactionInstruction {
  const data = Buffer.concat([
    Buffer.from(Int8Array.from([3]).buffer),
    Buffer.concat(seeds),
  ]);

  const keys = [
    {
      pubkey: vestingAccountKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: currentDestinationTokenAccount,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: currentDestinationTokenAccountOwner,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: targetDestinationTokenAccount,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new web3.TransactionInstruction({
    keys,
    programId: vestingProgramId,
    data,
  });
}

/**
 * This function can be used to lock tokens
 * @param connection The Solana RPC connection object
 * @param programId The token vesting program ID
 * @param seedWord Seed words used to derive the vesting account
 * @param payer The fee payer of the transaction
 * @param sourceTokenOwner The owner of the source token account (i.e where locked tokens are originating from)
 * @param possibleSourceTokenPubkey The source token account (i.e where locked tokens are originating from), if null it defaults to the ATA
 * @param destinationTokenPubkey The destination token account i.e where unlocked tokens will be transfered
 * @param mintAddress The mint of the tokens being vested
 * @param schedules The array of vesting schedules
 * @returns An array of `web3.TransactionInstruction`
 */
export async function prepareLock(
  connection: web3.Connection,
  programId: web3.PublicKey,
  seedWord: Buffer | Uint8Array,
  payer: web3.PublicKey,
  sourceTokenOwner: web3.PublicKey,
  possibleSourceTokenPubkey: web3.PublicKey | null,
  destinationTokenPubkey: web3.PublicKey,
  mintAddress: web3.PublicKey,
  schedules: Array<Schedule>,
): Promise<PrepareLockReturn> {
  // If no source token account was given, use the associated source account
  if (possibleSourceTokenPubkey == null) {
    possibleSourceTokenPubkey = await spl.getAssociatedTokenAddress(
      mintAddress,
      sourceTokenOwner,
      true,
    );
  }

  // Find the non reversible public key for the vesting contract via the seed
  seedWord = seedWord.slice(0, 31);
  const [vestingAccountKey, bump] = await web3.PublicKey.findProgramAddress(
    [seedWord],
    programId,
  );

  const vestingTokenAccountKey = await spl.getAssociatedTokenAddress(
    mintAddress,
    vestingAccountKey,
    true,
  );

  seedWord = Buffer.from(seedWord.toString('hex') + bump.toString(16), 'hex');

  const check_existing = await connection.getAccountInfo(vestingAccountKey);
  if (!!check_existing) {
    throw 'Contract already exists.';
  }

  const instructions = [
    createInitInstruction(
      web3.SystemProgram.programId,
      programId,
      payer,
      vestingAccountKey,
      [seedWord],
      schedules.length,
    ),
    spl.createAssociatedTokenAccountInstruction(
      payer,
      vestingTokenAccountKey,
      vestingAccountKey,
      mintAddress,
    ),
    createCreateInstruction(
      programId,
      spl.TOKEN_PROGRAM_ID,
      vestingAccountKey,
      vestingTokenAccountKey,
      sourceTokenOwner,
      possibleSourceTokenPubkey,
      destinationTokenPubkey,
      mintAddress,
      schedules,
      [seedWord],
    ),
  ];
  return { vestingAccountKey, vestingTokenAccountKey, instructions };
}

/**
 * This function can be used to unlock vested tokens
 * @param connection The Solana RPC connection object
 * @param programId The token vesting program ID
 * @param seedWord Seed words used to derive the vesting account
 * @param mintAddress The mint of the vested tokens
 * @returns An array of `web3.TransactionInstruction`
 */
export async function prepareUnlockInstructions(
  connection: web3.Connection,
  programId: web3.PublicKey,
  seedWord: Buffer | Uint8Array,
  mintAddress: web3.PublicKey,
): Promise<Array<web3.TransactionInstruction>> {
  seedWord = seedWord.slice(0, 31);
  const [vestingAccountKey, bump] = await web3.PublicKey.findProgramAddress(
    [seedWord],
    programId,
  );
  seedWord = Buffer.from(seedWord.toString('hex') + bump.toString(16), 'hex');

  const vestingTokenAccountKey = await spl.getAssociatedTokenAddress(
    mintAddress,
    vestingAccountKey,
    true,
  );

  const vestingInfo = await getContractInfo(connection, vestingAccountKey);

  const instruction = [
    createUnlockInstruction(
      programId,
      spl.TOKEN_PROGRAM_ID,
      web3.SYSVAR_CLOCK_PUBKEY,
      vestingAccountKey,
      vestingTokenAccountKey,
      vestingInfo.destinationAddress,
      [seedWord],
    ),
  ];

  return instruction;
}

/**
 * This function can be used retrieve information about a vesting account
 * @param connection The Solana RPC connection object
 * @param vestingAccountKey The vesting account public key
 * @returns A `ContractInfo` object
 */
export async function getContractInfo(
  connection: web3.Connection,
  vestingAccountKey: web3.PublicKey,
): Promise<ContractInfo> {
  console.log('Fetching contract ', vestingAccountKey.toBase58());
  const vestingInfo = await connection.getAccountInfo(
    vestingAccountKey,
    'single',
  );
  if (!vestingInfo) {
    throw new Error('Vesting contract account is unavailable');
  }
  const info = ContractInfo.fromBuffer(vestingInfo!.data);
  if (!info) {
    throw new Error('Vesting contract account is not initialized');
  }
  return info!;
}

/**
 * This function can be used to transfer a vesting account to a new wallet. It requires the current owner to sign.
 * @param connection The Solana RPC connection object
 * @param programId The token vesting program ID
 * @param currentDestinationTokenAccount The current token account to which the vested tokens are transfered to as they unlock
 * @param newDestinationTokenAccountOwner The new owner of the vesting account
 * @param newDestinationTokenAccount The new token account to which the vested tokens will be transfered to as they unlock
 * @param vestingSeed Seed words used to derive the vesting account
 * @returns An array of `web3.TransactionInstruction`
 */
export async function prepareChangeDestinationInstructions(
  connection: web3.Connection,
  programId: web3.PublicKey,
  currentDestinationTokenAccount: web3.PublicKey,
  newDestinationTokenAccountOwner: web3.PublicKey | undefined,
  newDestinationTokenAccount: web3.PublicKey | undefined,
  vestingSeed: Array<Buffer | Uint8Array>,
): Promise<Array<web3.TransactionInstruction>> {
  let seedWord = vestingSeed[0];
  seedWord = seedWord.slice(0, 31);
  const [vestingAccountKey, bump] = await web3.PublicKey.findProgramAddress(
    [seedWord],
    programId,
  );
  seedWord = Buffer.from(seedWord.toString('hex') + bump.toString(16), 'hex');

  const contractInfo = await getContractInfo(connection, vestingAccountKey);
  if (!newDestinationTokenAccount) {
    if (!!newDestinationTokenAccountOwner) {
      console.log(
        'At least one of newDestinationTokenAccount and newDestinationTokenAccountOwner must be provided!',
      );
      return [];
    }

    newDestinationTokenAccount = await spl.getAssociatedTokenAddress(
      contractInfo.mintAddress,
      newDestinationTokenAccountOwner!,
      true,
    );
  }

  return [
    createChangeDestinationInstruction(
      programId,
      vestingAccountKey,
      currentDestinationTokenAccount,
      contractInfo.destinationAddress,
      newDestinationTokenAccount,
      [seedWord],
    ),
  ];
}

export async function getLockInstructions(
  connection: web3.Connection,
  unlockDates: Date[],
  amountPerSchedule: number,
  sourceAccount: web3.PublicKey,
  destinationAccount: web3.PublicKey,
  mint: web3.PublicKey,
): Promise<GetLockReturn> {
  const instructions: web3.TransactionInstruction[] = [];
  let decimals = 0;
  try {
    const mintInfo = await spl.getMint(connection, mint, connection.commitment);
    decimals = mintInfo.decimals;
  } catch (err) {
    throw new Error("Mint not found");
  }
  const [sourceTokenAccount, destinationTokenAccount] = await Promise.all([
    spl.getAssociatedTokenAddress(mint, sourceAccount, false),
    spl.getAssociatedTokenAddress(mint, destinationAccount, false),
  ]);
  let hasTokenBalance = false;
  try {
    const account = await spl.getAccount(connection, sourceTokenAccount, connection.commitment);
    hasTokenBalance = account.amount >= unlockDates.length  * amountPerSchedule * Math.pow(10, decimals);
  } catch (err) {
    throw new Error("Source token account should exist");
  }
  if (!hasTokenBalance) {
    throw new Error("Source token account does not have enough balance");
  }
  try {
    await spl.getAccount(connection, destinationTokenAccount, connection.commitment);
  } catch (err) {
    instructions.push(
      spl.createAssociatedTokenAccountInstruction(
        sourceAccount,
        destinationTokenAccount,
        destinationAccount,
        mint,
        spl.TOKEN_PROGRAM_ID,
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }
  const schedules: Schedule[] = [];
  for (const date of unlockDates) {
    schedules.push(
      new Schedule(
        /** Has to be in seconds */
        // @ts-ignore
        new Numberu64(date.getTime() / 1_000),
        /** Don't forget to add decimals */
        // @ts-ignore
        new Numberu64(amountPerSchedule * Math.pow(10, decimals)),
      ),
    );
  }
  const seed = generateRandomSeed();
  const { vestingAccountKey, vestingTokenAccountKey, instructions: prepareLockInstructions } = await prepareLock(
    connection,
    TOKEN_VESTING_PROGRAM_ID,
    Buffer.from(seed),
    sourceAccount,
    sourceAccount,
    sourceTokenAccount,
    destinationTokenAccount,
    mint,
    schedules,
  );
  instructions.push(...prepareLockInstructions);
  return { seed, vestingAccountKey, vestingTokenAccountKey, instructions, sourceTokenAccount };
}

export async function getUnlockInstructions(
  connection: web3.Connection,
  seed: string,
  mint: web3.PublicKey,
) {
  return prepareUnlockInstructions(connection, TOKEN_VESTING_PROGRAM_ID, Buffer.from(seed), mint);
}
