"use client"
import PhantomWalletButton from "@/components/PhantomWalletButton";
import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function Home () { 
  const endpoint = clusterApiUrl("devnet");
  const wallets = useMemo(() => [], []);
  return (
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets}>
      <PhantomWalletButton />
    </WalletProvider>
  </ConnectionProvider>
  );
};
