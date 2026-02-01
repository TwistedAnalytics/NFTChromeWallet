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
        
        <div className="relative px-6 pt-4 pb-3">
          {/* Total Balance */}
          <div className="text-center mb-4">
            <p className="text-gray-400 text-xs mb-1">Total Balance</p>
            <div className="flex items-center justify-center gap-2 mb-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ${(parseFloat(balance) * 150 + parseFloat(ethBalance) * 2400).toFixed(2)}
              </h1>
              <button
                onClick={handleRefresh}
                className="p-1.5 hover:bg-white/10 rounded-full transition-all"
                title="Refresh balance"
              >
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => navigate('send')}
                className="w-full max-w-[280px] btn-primary py-2.5 px-6 flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Section */}
      <div className="px-4 pb-3">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Your Assets</h2>
          <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
            Manage
          </button>
        </div>

        {/* Token List */}
        <div className="space-y-2">
          {/* Solana Token */}
          <div className="card hover:bg-white/5 transition-all cursor-pointer group py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Token Icon */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 101 88" fill="currentColor">
                    <path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6909C0.558829 87.4892 0.302949 87.2003 0.135908 86.8558C-0.0311326 86.5113 -0.0438437 86.1247 0.0985413 85.7721C0.241126 85.4194 0.479312 85.1155 0.784368 84.8984L17.4575 67.4787C17.8199 67.1003 18.2585 66.7986 18.7458 66.5924C19.2331 66.3862 19.7588 66.2799 20.29 66.28H99.3293C99.7064 66.28 100.075 66.3874 100.391 66.5891C100.706 66.7909 100.962 67.0798 101.129 67.4243C101.296 67.7688 101.309 68.1554 101.166 68.508C101.024 68.8606 100.786 69.1645 100.48 69.3817ZM83.8068 34.2437C83.4444 33.8653 83.0058 33.5636 82.5185 33.3574C82.0312 33.1512 81.5055 33.0449 80.9743 33.0449H1.93563C1.55849 33.0449 1.18957 33.1523 0.874202 33.354C0.558829 33.5558 0.302949 33.8447 0.135908 34.1892C-0.0311326 34.5337 -0.0438437 34.9203 0.0985413 35.2729C0.241126 35.6255 0.479312 35.9294 0.784368 36.1466L17.4575 53.5663C17.8199 53.9447 18.2585 54.2464 18.7458 54.4526C19.2331 54.6588 19.7588 54.7651 20.29 54.7651H99.3293C99.7064 54.7651 100.075 54.6577 100.391 54.456C100.706 54.2542 100.962 53.9653 101.129 53.6208C101.296 53.2763 101.309 52.8897 101.166 52.5371C101.024 52.1845 100.786 51.8806 100.48 51.6634L83.8068 34.2437ZM1.93563 21.7202H80.9743C81.5055 21.7202 82.0312 21.6139 82.5185 21.4077C83.0058 21.2015 83.4444 20.8998 83.8068 20.5214L100.48 3.10171C100.786 2.88453 101.024 2.5806 101.166 2.22802C101.309 1.87545 101.296 1.48881 101.129 1.14433C100.962 0.799846 100.706 0.510918 100.391 0.309165C100.075 0.107413 99.7064 -1.23674e-06 99.3293 0L20.29 0C19.7588 -1.23674e-06 19.2331 0.106289 18.7458 0.312492C18.2585 0.518695 17.8199 0.820408 17.4575 1.19877L0.784368 18.6185C0.479312 18.8357 0.241126 19.1396 0.0985413 19.4922C-0.0438437 19.8448 -0.0311326 20.2314 0.135908 20.5759C0.302949 20.9204 0.558829 21.2093 0.874202 21.411C1.18957 21.6128 1.55849 21.7202 1.93563 21.7202Z"/>
                  </svg>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white text-sm">Solana</p>
                    <span className="text-[10px] text-gray-500">SOL</span>
                  </div>
                  <p className="text-xs text-gray-400">{parseFloat(balance).toFixed(4)} SOL</p>
                  <button
                    onClick={() => copyAddress(address || '')}
                    className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                  >
                    <span>{formatAddress(address || '')}</span>
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-white text-sm">${(parseFloat(balance) * 150).toFixed(2)}</p>
                <p className="text-xs text-green-400">+2.5%</p>
              </div>
            </div>
          </div>

          {/* Ethereum Token */}
          <div className="card hover:bg-white/5 transition-all cursor-pointer group py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Token Icon */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 784.37 1277.39" fill="currentColor">
                    <polygon points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54"/>
                    <polygon points="392.07,0 0,650.54 392.07,882.29 392.07,472.33"/>
                    <polygon points="392.07,956.52 387.24,962.41 387.24,1263.28 392.07,1277.38 784.37,724.89"/>
                    <polygon points="392.07,1277.38 392.07,956.52 0,724.89"/>
                  </svg>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white text-sm">Ethereum</p>
                    <span className="text-[10px] text-gray-500">ETH</span>
                  </div>
                  <p className="text-xs text-gray-400">{parseFloat(ethBalance).toFixed(4)} ETH</p>
                  <button
                    onClick={() => copyAddress(ethAddress || '')}
                    className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                  >
                    <span>{formatAddress(ethAddress || '')}</span>
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-white text-sm">${(parseFloat(ethBalance) * 2400).toFixed(2)}</p>
                <p className="text-xs text-green-400">+1.8%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
