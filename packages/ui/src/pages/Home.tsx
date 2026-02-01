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
  alert('Copied!');
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div className="h-full">
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
              <button 
                onClick={() => navigate('send')}
                className="w-full max-w-[280px] btn-primary py-3 px-6 flex items-center justify-center gap-2"
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
                  <svg className="w-7 h-7 text-white" viewBox="0 0 101 88" fill="currentColor">
                  <path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0267847 85.794C0.0894875 85.4314 0.263131 85.0952 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3174 19.5002 66.2108 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.973 68.4155C100.911 68.7781 100.737 69.1143 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0267847 35.3108C0.0894875 35.6734 0.263131 36.0096 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3753 18.4904 54.5814C18.9762 54.7875 19.5002 54.8941 20.0301 54.8953H99.0644C99.4415 54.8953 99.8104 54.7879 100.126 54.5865C100.441 54.385 100.689 54.0982 100.84 53.7612C100.99 53.4243 101.036 53.0519 100.973 52.6893C100.911 52.3267 100.737 51.9905 100.48 51.7231L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90479 100.911 2.56862 100.973 2.20603C101.036 1.84343 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 0 99.0644 0H20.0301C19.5002 0.00131577 18.9762 0.107922 18.4904 0.313976C18.0047 0.520029 17.5676 0.821088 17.2061 1.19848L0.524723 18.6183C0.267681 18.8857 0.0940427 19.2219 0.0313417 19.5844C-0.0313593 19.947 0.0146526 20.3194 0.164974 20.6563C0.315295 20.9933 0.563371 21.2801 0.878722 21.4816C1.19407 21.6831 1.56298 21.7905 1.94013 21.7905H1.93563Z"/>
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
