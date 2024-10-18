import { useState } from 'react';
import { Transition } from '@headlessui/react';

const TechForm = () => {
  const [aluizioValue, setAluizioValue] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Aluizio Value:', aluizioValue);

    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000); // Hide alert after 3 seconds
    setAluizioValue(''); // Clear the input after submit
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-black to-gray-900 p-6">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md p-8 bg-gradient-to-b from-gray-800 to-black rounded-xl shadow-lg transform hover:scale-105 transition-all duration-500"
      >
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 text-center mb-6">
          Tech Form
        </h2>

        {/* Aluizio Value Field */}
        <div className="relative mb-6">
          <input
            type="text"
            value={aluizioValue}
            onChange={(e) => setAluizioValue(e.target.value)}
            placeholder="Enter Aluizio Value"
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
    </div>
  );
};

export default TechForm;
