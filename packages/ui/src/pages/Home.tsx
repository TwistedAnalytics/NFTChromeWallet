import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigation } from '../contexts/NavigationContext';

export const Home: React.FC = () => {
  const { address, ethAddress, balance, ethBalance, initialize } = useWallet();
  const { navigate } = useNavigation();

  const handleRefresh = () => {
    initialize();
  };

  return (
    <div>
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Balances</h2>
          <button
            onClick={handleRefresh}
            className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 bg-gray-700 rounded"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Solana (SOL)</span>
            <span className="text-xl font-bold text-indigo-400">{balance} SOL</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Ethereum (ETH)</span>
            <span className="text-xl font-bold text-purple-400">{ethBalance} ETH</span>
          </div>
        </div>
        
        {(parseFloat(balance) < 0.01 || parseFloat(ethBalance) < 0.001) && (
          <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
            <p className="text-xs text-yellow-200">
              ⚠️ <strong>Need Gas Fees:</strong> To transfer NFTs, you need:
            </p>
            <ul className="text-xs text-yellow-200 mt-1 ml-4 list-disc">
              {parseFloat(balance) < 0.01 && <li>~0.01 SOL for Solana NFTs</li>}
              {parseFloat(ethBalance) < 0.001 && <li>~0.001 ETH for Ethereum NFTs</li>}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => navigate('gallery')}
          className="card text-center hover:border-indigo-500 transition-colors cursor-pointer"
        >
          <div className="text-3xl mb-2">🖼️</div>
          <div className="font-semibold text-xs">NFTs</div>
        </button>
        <button
          onClick={() => navigate('send')}
          className="card text-center hover:border-indigo-500 transition-colors cursor-pointer"
        >
          <div className="text-3xl mb-2">📤</div>
          <div className="font-semibold text-xs">Send</div>
        </button>
        <button
          onClick={() => navigate('settings')}
          className="card text-center hover:border-indigo-500 transition-colors cursor-pointer"
        >
          <div className="text-3xl mb-2">⚙️</div>
          <div className="font-semibold text-xs">Settings</div>
        </button>
      </div>

      <div className="space-y-3">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-indigo-400">Solana Address</h3>
            <span className="text-xs text-gray-500">Receive SOL NFTs</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs break-all flex-1 bg-gray-800 p-2 rounded">{address}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(address || '');
                alert('Copied!');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 bg-gray-800 rounded"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-purple-400">Ethereum Address</h3>
            <span className="text-xs text-gray-500">Receive ETH NFTs</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs break-all flex-1 bg-gray-800 p-2 rounded">{ethAddress}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(ethAddress || '');
                alert('Copied!');
              }}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 bg-gray-800 rounded"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
