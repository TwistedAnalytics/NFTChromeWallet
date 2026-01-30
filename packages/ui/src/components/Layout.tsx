import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from '../hooks/useNavigate';

export const Home: React.FC = () => {
  const { address, ethAddress, balance, ethBalance } = useWallet();
  const navigate = useNavigate();

  return (
    <div>
      <div className="card mb-4">
        <h2 className="text-lg font-semibold mb-3">Balances</h2>
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
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => navigate('gallery')}
          className="card text-center hover:border-indigo-500 transition-colors cursor-pointer"
        >
          <div className="text-3xl mb-2">🖼️</div>
          <div className="font-semibold">NFTs</div>
        </button>
        <button
          onClick={() => navigate('settings')}
          className="card text-center hover:border-indigo-500 transition-colors cursor-pointer"
        >
          <div className="text-3xl mb-2">⚙️</div>
          <div className="font-semibold">Settings</div>
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
              onClick={() => navigator.clipboard.writeText(address || '')}
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
              onClick={() => navigator.clipboard.writeText(ethAddress || '')}
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
