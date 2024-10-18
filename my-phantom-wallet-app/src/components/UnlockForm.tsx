import { useState } from 'react';
import { Transition } from '@headlessui/react';
import usePhantomAdapter from '@/hooks/usePhantomAdapter';
import { PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { getUnlockInstructions, GetUnlockReturn } from '@/vesting_program/instructions';
import { useConnection } from '@solana/wallet-adapter-react';
import { getExplorerLink } from '@/utils/getExplorerLink';
import { Schedule } from '@/vesting_program/state';

interface UnlockResult extends Omit<GetUnlockReturn, "instructions"> {
  txSignature: string;
}

const UnlockForm = () => {
  const [seed, setSeed] = useState<string>('');
  const [mint, setMint] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unlockResult, setUnlockResult] = useState<UnlockResult | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { adapter } = usePhantomAdapter();
  const { connection } = useConnection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let mintPubkey: PublicKey | null = null;
      try {
        mintPubkey = new PublicKey(mint);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_err: unknown) {
        throw new Error("Invalid mint");
      }
      if (!adapter) {
        throw new Error("Phantom Wallet not found. Please install it first.");
      }
      await adapter.disconnect();
      await adapter.connect();
      if (!adapter.publicKey) {
        throw { error: "Adapter public key not found" };
      }
      const { contractInfo, instructions, vestingAccountKey } = await getUnlockInstructions(connection, seed, mintPubkey);
      const message = new TransactionMessage({
        payerKey: adapter.publicKey,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
        instructions,
      }).compileToV0Message();
      const txSignature = await adapter.sendTransaction(new VersionedTransaction(message), connection);
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000); // Hide alert after 3 seconds
      setUnlockResult({ contractInfo, vestingAccountKey, txSignature });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Something went wrong");
        console.error(err);
      }
    }
  };

  const nextSchedules: Schedule[] = unlockResult
    ? unlockResult.contractInfo.schedules.filter((schedule) => Date.now() <= schedule.releaseTime.toNumber() * 1000)
    : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-black to-gray-900 p-6">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md p-8 bg-gradient-to-b from-gray-800 to-black rounded-xl shadow-lg transform hover:scale-105 transition-all duration-500"
      >
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 text-center mb-6">
          Unlock Form
        </h2>

        {/* Seed Field */}
        <div className="relative mb-6">
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Enter the seed"
            className="w-full px-4 py-3 text-lg text-white bg-gray-900 border border-cyan-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all placeholder-gray-400"
          />
        </div>

        {/* Mint Field */}
        <div className="relative mb-6">
          <input
            type="text"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            placeholder="Enter the mint"
            className="w-full px-4 py-3 text-lg text-white bg-gray-900 border border-cyan-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all placeholder-gray-400"
          />
        </div>

        {/* Confirm Button */}
        <button
          type="submit"
          className="w-full py-3 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Confirm
        </button>

        {errorMessage && (
          <p className="text-red-500 mt-4 text-center font-semibold">{errorMessage}</p>
        )}

        {/* Success Alert */}
        <Transition
          show={isSubmitted}
          enter="transition-opacity duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="absolute inset-x-0 bottom-[-60px] bg-green-500 text-white text-center py-2 rounded-lg shadow-lg">
            Value submitted successfully!
          </div>
        </Transition>
      </form>
      {!!unlockResult && (
          <Transition
            show={!!unlockResult}
            enter="transition-opacity duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg w-fit">
              <div>
                <div className='flex items-center justify-between'>
                  <span>Destination token account</span>
                  <a
                    target="_blank"
                    href={getExplorerLink("address", unlockResult.contractInfo.destinationAddress.toBase58(), "devnet")}
                  >
                    {unlockResult.contractInfo.destinationAddress.toBase58()}
                  </a>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Vesting Account</span>
                  <a
                    target="_blank"
                    href={getExplorerLink("address", unlockResult.vestingAccountKey.toBase58(), "devnet")}
                  >
                    {unlockResult.vestingAccountKey.toBase58()}
                  </a>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Mint</span>
                  <a
                    target="_blank"
                    href={getExplorerLink("address", unlockResult.contractInfo.mintAddress.toBase58(), "devnet")}
                  >
                    {unlockResult.contractInfo.mintAddress.toBase58()}
                  </a>
                </div>
                {!!nextSchedules.length && (
                  <ul>
                    {nextSchedules.map((schedule) =>
                      <li key={schedule.releaseTime.toNumber()}>
                        {new Date(schedule.releaseTime.toNumber() * 1000).toLocaleString()}
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <div className="flex justify-center items-center">
                <button
                  type="button"
                  onClick={() => setUnlockResult(null)}
                  className="text-red-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </Transition>
        )}
    </div>
  );
};

export default UnlockForm;
