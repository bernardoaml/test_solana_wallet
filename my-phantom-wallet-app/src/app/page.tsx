"use client"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";
import { Adapter } from "@solana/wallet-adapter-base";
import PhantomWalletButton from "@/components/PhantomWalletButton";
import VestingForm from "@/components/VestingForm";

export const storageAutoAdapterConnectKey = "__pv_conn";

export default function Home () { 
  const endpoint = clusterApiUrl("devnet");
  const wallets = useMemo(() => [], []);
  const autoConnect: (adapter: Adapter) => Promise<boolean> = async (adapter) => {
    if (localStorage.getItem(storageAutoAdapterConnectKey) === "false") {
      await adapter.disconnect();
      return false;
    }
    return true;
  }
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider autoConnect={autoConnect} wallets={wallets}>
        <main>
          <PhantomWalletButton />
          <VestingForm />
        </main>
      </WalletProvider>
    </ConnectionProvider>
  );
};
