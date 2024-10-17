import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Transition } from '@headlessui/react';
import { TrashIcon } from '@heroicons/react/16/solid';

const AdvancedTokenForm = () => {
  const [mint, setMint] = useState('');
  const [destinyKey, setDestinyKey] = useState('');
  const [releaseDates, setReleaseDates] = useState<Date[]>([]);
  const [tokenAmount, setTokenAmount] = useState<number | ''>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mint || !destinyKey || releaseDates.length === 0 || tokenAmount === '') {
      setErrorMessage('Please fill out all fields correctly.');
      return;
    }
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000); // Alert hides after 3 seconds
    console.log({ mint, destinyKey, releaseDates, tokenAmount });
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
          <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
            Form submitted successfully!
          </div>
        </Transition>
      </form>
    </div>
  );
};

export default AdvancedTokenForm;
