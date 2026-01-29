import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from '../hooks/useNavigate';

export const Home: React.FC = () => {
  const { address, balance } = useWallet();
  const navigate = useNavigate();

  return (
    <div>
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Total Balance</h2>
            <p className="text-3xl font-bold text-indigo-400">{balance} ETH</p>
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

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Your Address</h3>
        <div className="flex items-center justify-between">
          <code className="text-sm">{address}</code>
          <button
            onClick={() => navigator.clipboard.writeText(address || '')}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};
