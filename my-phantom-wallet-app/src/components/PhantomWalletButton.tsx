"use client";
import { ChangeEvent, useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import usePhantomAdapter from '@/hooks/usePhantomAdapter';
import { storageAutoAdapterConnectKey } from '@/app/page';

const PhantomWalletButton = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [autoAdapterConnect, setAutoAdapterConnect] = useState(false);
  const [loading, setLoading] = useState(true);
  const { adapter } = usePhantomAdapter();

  // Function to connect to the Phantom Wallet
  const connectWallet = async () => {
    try {
      if (!adapter) {
        setErrorMessage('Phantom Wallet not found. Please install the extension.');
        return;
      }
      await adapter.connect();
      if (!adapter.publicKey) {
        setErrorMessage("Something went wrong");
        return;
      }
      setWalletAddress(adapter.publicKey.toBase58());
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error connecting to wallet:', error.message);
        setErrorMessage(`Unexpected error: ${error.message}`);
      } else {
        console.error(error);
      }
    }
  };

  // Function to disconnect the wallet
  const disconnectWallet = async () => {
    try {
      if (!adapter) {
        setErrorMessage('Phantom Wallet not found. Please install the extension.');
        return;
      }
      await adapter.disconnect();
      setAutoAdapterConnect(false);
      localStorage.setItem(storageAutoAdapterConnectKey, "false");
      setWalletAddress(null);
      setShowAlert(true); // Show alert when wallet is disconnecte
      // Hide the alert after 3 seconds
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error connecting to wallet:', error.message);
        setErrorMessage(`Unexpected error: ${error.message}`);
      } else {
        console.error(error);
      }
    }
  };

  const handleAutoAdapterConnect = async (ev: ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem(storageAutoAdapterConnectKey, String(ev.currentTarget.checked));
    setAutoAdapterConnect(ev.currentTarget.checked);
  }

  useEffect(() => {
    if (localStorage.getItem(storageAutoAdapterConnectKey) === "true" && adapter) {
      connectWallet().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [adapter]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500">
      <div className="p-8 bg-white rounded-lg shadow-lg">
        {loading ? (
          <p className="text-2xl font-semibold text-gray-800">Loading...</p>
        ) : walletAddress ? (
          <>
            <p className="text-2xl font-semibold text-gray-800">
              Connected: <span className="text-green-600">{walletAddress}</span>
            </p>
            <button
              onClick={disconnectWallet}
              className="mt-4 w-full px-6 py-3 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all"
            >
              Disconnect Wallet
            </button>
          </>
        ) : (
          <>
            <button
              onClick={connectWallet}
              className="w-full px-6 py-3 text-white bg-green-500 rounded-lg hover:bg-green-600 transition-all"
            >
              Connect Phantom Wallet
            </button>
            <input
              id="auto-connect-option"
              type="checkbox"
              checked={autoAdapterConnect || false}
              onChange={handleAutoAdapterConnect}
            />
            <label
              htmlFor="auto-connect-option"
              className="text-black ml-1"
            >
              Auto Connect
            </label>
          </>
        )}
        {errorMessage && (
          <p className="mt-4 text-red-600 font-semibold">{errorMessage}</p>
        )}
      </div>

      {/* Alert Message on Disconnect */}
      <Transition
        show={showAlert}
        enter="transition-opacity duration-500"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-500"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
          Wallet disconnected successfully!
        </div>
      </Transition>
    </div>
  );
};

export default PhantomWalletButton;
