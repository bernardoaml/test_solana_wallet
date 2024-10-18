"use client";
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Transition } from '@headlessui/react';
import { TrashIcon } from '@heroicons/react/16/solid';
import { PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { getLockInstructions, GetLockReturn } from '@/vesting_program/instructions';
import { useConnection } from '@solana/wallet-adapter-react';
import usePhantomAdapter from '@/hooks/usePhantomAdapter';
import { getExplorerLink } from '@solana-developers/helpers';

interface VestingResult extends Omit<GetLockReturn, "instructions"> {
  txSignature: string;
}

const AdvancedTokenForm = () => {
  const [mint, setMint] = useState('9hqgP2o5xpqfxVxCG64QXJcGR2ZMZN3FiTD3om6ARRZC');
  const [destinyKey, setDestinyKey] = useState('9cLV7pNTsHEfJgzDVv15KF7rQu3LmKxS1cQujGcAWGyw');
  const [releaseDates, setReleaseDates] = useState<Date[]>([]);
  const [tokenAmount, setTokenAmount] = useState<number | ''>(1000000);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vestingResult, setVestingResult] = useState<VestingResult | null>(null);
  const { adapter, error } = usePhantomAdapter();
  const { connection } = useConnection();

  const addReleaseDate = (date: Date | null) => {
    if (!date) return; // Ignore null values
    if (date < new Date()) {
      setErrorMessage('Release date must be in the future.');
      return;
    }
    if (releaseDates.length >= 5) {
      setErrorMessage('You can only select up to 5 release dates.');
      return;
    }
    setReleaseDates([...releaseDates, date]);
    setErrorMessage(null);
  };

  const removeReleaseDate = (index: number) => {
    const updatedDates = releaseDates.filter((_, i) => i !== index);
    setReleaseDates(updatedDates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    if (!adapter) {
      setErrorMessage("Phantom not found");
      return;
    }
    setErrorMessage(null);
    let mintPubkey: PublicKey | null = null;
    let destinyPubkey: PublicKey | null = null;
    try {
      mintPubkey = new PublicKey(mint);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err: unknown) {
      setErrorMessage("Invalid mint address.");
      return;
    }
    try {
      destinyPubkey = new PublicKey(destinyKey);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err: unknown) {
      setErrorMessage("Invalid destiny address.");
      return;
    }
    if (releaseDates.length === 0) {
      setErrorMessage("Please select a release date.");
      return;
    }
    const amountPerSchedule = Number(tokenAmount);
    if (Number.isNaN(amountPerSchedule) || !amountPerSchedule) {
      setErrorMessage("Invalid token amount. It should be greater than 0.")
      return;
    }
    try {
      await adapter.disconnect();
      await adapter.connect();
      if (!adapter.publicKey) {
        throw new Error("Phantom wallet public key not found");
      }
      const {
        seed,
        vestingAccountKey,
        vestingTokenAccountKey,
        instructions,
        sourceTokenAccount,
      } = await getLockInstructions(
        connection,
        releaseDates,
        Number(tokenAmount),
        adapter.publicKey,
        destinyPubkey,
        mintPubkey,
      );
      const message = new TransactionMessage({
        payerKey: adapter.publicKey,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
        instructions,
      }).compileToV0Message();
      const txSignature = await adapter.sendTransaction(new VersionedTransaction(message), connection);
      setVestingResult({ seed, vestingAccountKey, vestingTokenAccountKey, txSignature, sourceTokenAccount });
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Something went wrong");
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-purple-900 to-black p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow-2xl rounded-lg p-8 space-y-6 transform hover:scale-105 transition duration-300"
      >
        <h2 className="text-3xl font-bold text-center text-gray-900">Token Distribution Form</h2>

        {/* Mint Field */}
        <div className="space-y-1">
          <label htmlFor="mint" className="block text-lg font-medium text-gray-700">
            Mint
          </label>
          <input
            type="text"
            id="mint"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            placeholder="Enter Mint Address"
          />
        </div>

        {/* Destiny Public Key Field */}
        <div className="space-y-1">
          <label htmlFor="destinyKey" className="block text-lg font-medium text-gray-700">
            Destiny Public Key
          </label>
          <input
            type="text"
            id="destinyKey"
            value={destinyKey}
            onChange={(e) => setDestinyKey(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            placeholder="Enter Public Key"
          />
        </div>

        {/* Release Dates Field */}
        <div className="space-y-1">
          <label className="block text-lg font-medium text-gray-700">Release Dates</label>
          <DatePicker
            selected={null}
            onChange={(date) => addReleaseDate(date)}
            minDate={new Date()}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={5}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            placeholderText="Select up to 5 dates"
          />
          <ul className="space-y-2 mt-2">
            {releaseDates.map((date, index) => (
              <li key={index} className="flex items-center justify-between text-gray-600">
                {date.toDateString()}
                <button
                  type="button"
                  onClick={() => removeReleaseDate(index)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Token Amount per Release Dates */}
        <div className="space-y-1">
          <label htmlFor="tokenAmount" className="block text-lg font-medium text-gray-700">
            Token Amount per Release Date
          </label>
          <input
            type="number"
            step="0.00001"
            id="tokenAmount"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(parseFloat(e.target.value) || '')}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            placeholder="Enter Token Amount (e.g., 0.00001)"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300"
        >
          Confirm Selections
        </button>

        {/* Error Message */}
        {errorMessage && (
          <p className="text-red-500 mt-4 text-center font-semibold">{errorMessage}</p>
        )}

        {!!vestingResult && (
          <Transition
            show={!!vestingResult}
            enter="transition-opacity duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
              <div className='flex items-center justify-between'>
                <span>Seed</span>
                <span>{vestingResult.seed}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span>Your token account key</span>
                <a href={getExplorerLink("address", vestingResult.sourceTokenAccount.toBase58(), "devnet")}>{vestingResult.sourceTokenAccount.toBase58()}</a>
              </div>
              <div className='flex items-center justify-between'>
                <span>Vesting Account</span>
                <a href={getExplorerLink("address", vestingResult.vestingAccountKey.toBase58(), "devnet")}>{vestingResult.vestingAccountKey.toBase58()}</a>
              </div>
              <div className='flex items-center justify-between'>
                <span>Vesting Token Account</span>
                <a href={getExplorerLink("tx", vestingResult.vestingTokenAccountKey.toBase58(), "devnet")}>{vestingResult.vestingTokenAccountKey.toBase58()}</a>
              </div>
              <div className='flex items-center justify-between'>
                <span>Transaction signature:</span>
                <a href={getExplorerLink("tx", vestingResult.txSignature, "devnet")}>{vestingResult.txSignature}</a>
              </div>
            </div>
          </Transition>
        )}
      </form>
    </div>
  );
};

export default AdvancedTokenForm;
