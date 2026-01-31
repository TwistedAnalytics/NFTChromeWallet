import React, { useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigation } from '../contexts/NavigationContext';

export const Home: React.FC = () => {
  const { address, ethAddress, balance, ethBalance, initialize } = useWallet();
  const { navigate } = useNavigation();

  useEffect(() => {
    // Auto-fetch balance on mount
    initialize();
  }, []);

  const handleRefresh = () => {
    initialize();
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    // Could add a toast notification here
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-full">
      {/* Hero Section with Balance */}
      <div className="relative overflow-hidden">
        {/* Purple gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-transparent"></div>
        
        <div className="relative px-6 pt-8 pb-6">
          {/* Total Balance */}
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm mb-2">Total Balance</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ${(parseFloat(balance) * 150 + parseFloat(ethBalance) * 2400).toFixed(2)}
              </h1>
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
                title="Refresh balance"
              >
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-3 justify-center">
              <button className="flex-1 max-w-[140px] btn-primary py-3 px-6 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Buy
              </button>
              <button 
                onClick={() => navigate('send')}
                className="flex-1 max-w-[140px] btn-secondary py-3 px-6 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Section */}
      <div className="px-4 pb-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Your Assets</h2>
          <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Manage
          </button>
        </div>

        {/* Token List */}
        <div className="space-y-2">
          {/* Solana Token */}
          <div className="card hover:bg-white/5 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Token Icon */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.53 3.5l2.83 2.83-2.83 2.83L3 7.63l1.53-1.53L3 4.57l1.53-1.53zm8.18 0l2.83 2.83-2.83 2.83L11.18 7.63l1.53-1.53-1.53-1.53 1.53-1.53zm8.18 0l2.83 2.83-2.83 2.83-1.53-1.53 1.53-1.53-1.53-1.53 1.53-1.53z"/>
                  </svg>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">Solana</p>
                    <span className="text-xs text-gray-500">SOL</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-400">{parseFloat(balance).toFixed(4)} SOL</p>
                  </div>
                  <button
                    onClick={() => copyAddress(address || '')}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors mt-1 flex items-center gap-1"
                  >
                    <span>{formatAddress(address || '')}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-white">${(parseFloat(balance) * 150).toFixed(2)}</p>
                <p className="text-sm text-green-400">+2.5%</p>
              </div>
            </div>
          </div>

          {/* Ethereum Token */}
          <div className="card hover:bg-white/5 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Token Icon */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 784.37 1277.39" fill="currentColor">
                    <polygon points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54"/>
                    <polygon points="392.07,0 0,650.54 392.07,882.29 392.07,472.33"/>
                    <polygon points="392.07,956.52 387.24,962.41 387.24,1263.28 392.07,1277.38 784.37,724.89"/>
                    <polygon points="392.07,1277.38 392.07,956.52 0,724.89"/>
                  </svg>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">Ethereum</p>
                    <span className="text-xs text-gray-500">ETH</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-400">{parseFloat(ethBalance).toFixed(4)} ETH</p>
                  </div>
                  <button
                    onClick={() => copyAddress(ethAddress || '')}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors mt-1 flex items-center gap-1"
                  >
                    <span>{formatAddress(ethAddress || '')}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-white">${(parseFloat(ethBalance) * 2400).toFixed(2)}</p>
                <p className="text-sm text-green-400">+1.8%</p>
              </div>
            </div>
          </div>
        </div>

        {/* NFTs Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Collectibles</h2>
            <button 
              onClick={() => navigate('gallery')}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              View All →
            </button>
          </div>
          
          <button
            onClick={() => navigate('gallery')}
            className="w-full card hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center justify-center py-8 text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 text-purple-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">View your NFT collection</p>
              </div>
            </div>
          </button>
        </div>

        {/* Activity Button */}
        <div className="mt-6">
          <button className="w-full card hover:bg-white/5 transition-all group py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-white">Recent Activity</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
