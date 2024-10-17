"use client";

import { useState, useEffect } from 'react';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Transition } from '@headlessui/react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

declare global {
  interface Window {
    solana?: any;
  }
}

// mint
// destiny public key
// release dates
// token amount per release dates

const PhantomWalletButton = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { wallet } = useWallet();
  const { connection } = useConnection()
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);

  const WALLET_DISCONNECTED = 'walletDisconnected';

  const sendSol = async () => {
    try {
      await wallet?.adapter.connect();
      const recipientPubKey = new PublicKey('9KBg9gjskFjYWx4KjsXwFLJZaVX5FX52GHghzkELtYws');
   
      const transaction = new Transaction();
      const sendSolInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(walletAddress || ""),
        toPubkey: recipientPubKey,
        lamports: 0.001 * LAMPORTS_PER_SOL,
      });
      transaction.add(sendSolInstruction);

      const signature = await wallet?.adapter.sendTransaction(transaction, connection);
      console.log(`Transaction signature: ${signature}`);
    } catch (error) {
      console.error("Transaction failed", error);
    }
  };

  // Function to connect to the Phantom Wallet
  const connectWallet = async () => {
    try {
      const { solana } = window;

      if (solana && solana.isPhantom) {        
        const response = await solana.connect({ onlyIfTrusted: false });
        setWalletAddress(response.publicKey.toString());
        console.log('Connected to wallet:', response.publicKey.toString());
        console.log("connected")
        // Remove any previous disconnect flag
        localStorage.removeItem(WALLET_DISCONNECTED);
      } else {
        setErrorMessage('Phantom Wallet not found. Please install the extension.');
      }
    } catch (error: any) {
      console.error('Error connecting to wallet:', error.message);
      setErrorMessage(`Unexpected error: ${error.message}`);
    }
  };

  // Function to disconnect the wallet
  const disconnectWallet = () => {
    try {
      window.solana.disconnect();
      setWalletAddress(null);

      // Set a flag in localStorage to prevent auto-connection
      localStorage.setItem(WALLET_DISCONNECTED, 'true');
      setShowAlert(true); // Show alert when wallet is disconnected
      console.log('Wallet disconnected.');

      // Hide the alert after 3 seconds
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error: any) {
      console.error('Error disconnecting the wallet:', error.message);
      setErrorMessage(`Error disconnecting: ${error.message}`);
    }
  };

  // Check if the wallet is already connected
  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      try {
        const { solana } = window;

        // If a disconnect flag is present, skip auto-connection
        const isDisconnected = localStorage.getItem(WALLET_DISCONNECTED);
        if (isDisconnected) return;

        if (solana?.isPhantom) {
          const response = await solana.connect({ onlyIfTrusted: true });
          setWalletAddress(response.publicKey.toString());
          console.log('Wallet already connected:', response.publicKey.toString());
        }
      } catch (error: any) {
        console.error('Error checking wallet connection:', error.message);
      }
    };

    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500">
      <div className="p-8 bg-white rounded-lg shadow-lg">
        {walletAddress ? (
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
            <button onClick={sendSol} className='mt-4 w-full px-6 py-3 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all'>
              Teste Send Sol
            </button>
          </>
        ) : (
          <button
            onClick={connectWallet}
            className="w-full px-6 py-3 text-white bg-green-500 rounded-lg hover:bg-green-600 transition-all"
          >
            Connect Phantom Wallet
          </button>
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
