import React, { ReactNode } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigation } from '../contexts/NavigationContext';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showHeader = true }) => {
  const { address, lockWallet } = useWallet();
  const { navigate, state } = useNavigation();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div className="h-[600px] w-full bg-gradient-to-br from-[#1a1625] via-[#2d1b3d] to-[#1a1625] flex flex-col overflow-hidden">
      {/* Header - Fixed at top */}
      {showHeader && address && (
        <header className="flex-none backdrop-blur-xl bg-[#1a1625]/80 border-b border-purple-900/30">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <img src="/icons/wallet.png" alt="NFT Vault" className="w-8 h-8" />
                <span className="font-bold text-white text-lg">NFT Vault 1.X</span>
              </div>

              {/* Settings & Lock */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('settings')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  title="Settings"
                >
                  <svg className="w-5 h-5 text-gray-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                
                <button
                  onClick={async () => {
                    await lockWallet();
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  title="Lock Wallet"
                >
                  <svg className="w-5 h-5 text-gray-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content - Scrollable area between header and bottom nav */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation - Fixed at bottom */}
      {address && (
        <nav className="flex-none border-t border-purple-900/30 bg-[#1a1625]/95 backdrop-blur-xl">
          <div className="flex items-center justify-around px-4 py-3">
            <button
              onClick={() => navigate('home')}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-all ${
                state.currentPage === 'home'
                  ? 'text-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium">Home</span>
            </button>

            <button
              onClick={() => navigate('gallery')}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-all ${
                state.currentPage === 'gallery'
                  ? 'text-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">NFTs</span>
            </button>

            <button
              onClick={() => navigate('settings')}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-all ${
                state.currentPage === 'settings'
                  ? 'text-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="text-xs font-medium">Settings</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};
