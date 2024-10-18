"use client";
import { Adapter } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

interface AdapterState {
  adapter: Adapter | null;
}

export default function usePhantomAdapter(): AdapterState {
  const { wallets } = useWallet();
  const [adapterState, setAdapterState] = useState<AdapterState>({ adapter: null });

  useEffect(() => {
    const phantom = wallets.find((wallet) => wallet.adapter.name === "Phantom");
    if (!phantom) {
      return;
    }
    setAdapterState({ adapter: phantom.adapter });
  }, [wallets]);

  return adapterState;
}
