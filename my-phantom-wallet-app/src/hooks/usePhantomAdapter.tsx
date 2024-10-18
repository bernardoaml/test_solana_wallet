"use client";
import { Adapter } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

interface AdapterState {
  adapter: Adapter | null;
  error: Error | null;
}

export default function usePhantomAdapter(): AdapterState {
  const { wallets } = useWallet();
  const [adapterState, setAdapterState] = useState<AdapterState>({ adapter: null, error: null })

  useEffect(() => {
    const phantom = wallets.find((wallet) => wallet.adapter.name === "Phantom");
    if (!phantom) {
      setAdapterState({ error: new Error("Phantom not found. Install it"), adapter: null });
      return;
    }
    setAdapterState({ adapter: phantom.adapter, error: null });
  }, [wallets]);

  return adapterState;
}
