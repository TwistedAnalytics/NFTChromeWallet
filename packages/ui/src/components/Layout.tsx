import React, { ReactNode } from 'react';
import { useWallet } from '../hooks/useWallet';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showHeader = true }) => {
  const { address, balance, currentNetwork, lockWallet } = useWallet();

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
              onClick={lockWallet}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Lock
            </button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{formatAddress(address)}</span>
            <span className="text-indigo-400">{currentNetwork}</span>
          </div>
          <div className="mt-2 text-lg font-semibold">{balance} ETH</div>
        </header>
      )}
      <main className="p-4">{children}</main>
    </div>
  );
};
