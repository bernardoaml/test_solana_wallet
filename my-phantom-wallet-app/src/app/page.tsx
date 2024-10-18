"use client"
import PhantomWalletButton from "@/components/PhantomWalletButton";
import AdvancedTokenForm from "@/components/AdvancedTokenForm";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";

export default function Home () { 
  const endpoint = clusterApiUrl("devnet");
  const wallets = useMemo(() => [], []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider autoConnect={false} wallets={wallets}>
        <PhantomWalletButton />
        <AdvancedTokenForm/>
      </WalletProvider>
    </ConnectionProvider>
  );
};
