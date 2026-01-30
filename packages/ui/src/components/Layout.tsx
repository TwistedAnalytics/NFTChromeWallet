import React, { ReactNode } from 'react';
import { useWallet } from '../hooks/useWallet';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showHeader = true }) => {
  const { address, ethAddress, balance, ethBalance, currentNetwork, lockWallet } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {showHeader && address && (
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-indigo-400">VaultNFT</h1>
            <button
            onClick={async () => {
              await lockWallet();
            }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Lock
              </button>
          </div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-400">SOL: {formatAddress(address)}</span>
            <span className="text-indigo-400">{balance} SOL</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">ETH: {formatAddress(ethAddress || '')}</span>
            <span className="text-purple-400">{ethBalance} ETH</span>
          </div>
        </header>
      )}
      <main className="p-4">{children}</main>
    </div>
  );
};
