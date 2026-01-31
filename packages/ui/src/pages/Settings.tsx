import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigation } from '../contexts/NavigationContext';

export const Settings: React.FC = () => {
  const { lockWallet } = useWallet();
  const { navigate } = useNavigation();
  const [showSeed, setShowSeed] = useState(false);
  const [seed, setSeed] = useState('');

  const handleShowSeed = async () => {
    // Get seed from storage
    const result = await chrome.storage.local.get(['vaultData']);
    if (result.vaultData) {
      // In production, decrypt and show the mnemonic
      setShowSeed(true);
      setSeed('Your 12-word seed phrase would appear here after decryption');
    }
  };

  const handleLock = async () => {
    await lockWallet();
  };

  return (
    <div>
      <button
        onClick={() => navigate('home')}
        className="mb-4 text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-4">
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Backup</h3>
          <button
            onClick={handleShowSeed}
            className="w-full btn-secondary mb-2"
          >
            {showSeed ? 'Hide' : 'Show'} Seed Phrase
          </button>
          {showSeed && (
            <div className="mt-3 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
              <p className="text-xs text-yellow-200 mb-2">⚠️ Never share your seed phrase!</p>
              <p className="text-sm font-mono bg-gray-800 p-3 rounded">{seed}</p>
            </div>
          )}
        </div>

        <div className="card">
          <button
            onClick={handleLock}
            className="w-full btn-secondary"
          >
            Lock Wallet
          </button>
        </div>
      </div>
    </div>
  );
};
