import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigation } from '../contexts/NavigationContext';

export const Settings: React.FC = () => {
  const { lockWallet } = useWallet();
  const { navigate } = useNavigation();
  const [showSeed, setShowSeed] = useState(false);
  const [seed, setSeed] = useState('');
  const [autoLockTime, setAutoLockTime] = useState(15);

  const handleShowSeed = async () => {
    if (!showSeed) {
      try {
        // Get the actual mnemonic from background
        const response = await chrome.runtime.sendMessage({ type: 'GET_MNEMONIC' });
        if (response.success) {
          setSeed(response.data.mnemonic);
          setShowSeed(true);
        } else {
          alert('Failed to retrieve seed phrase');
        }
      } catch (error) {
        console.error('Error getting seed:', error);
        alert('Error retrieving seed phrase');
      }
    } else {
      setShowSeed(false);
      setSeed('');
    }
  };

  const handleLock = async () => {
    await lockWallet();
  };

  const handleAutoLockChange = async (minutes: number) => {
    setAutoLockTime(minutes);
    await chrome.runtime.sendMessage({ 
      type: 'SET_AUTO_LOCK_TIME', 
      data: { minutes } 
    });
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
          <h3 className="text-lg font-semibold mb-3">Backup Seed Phrase</h3>
          <button
            onClick={handleShowSeed}
            className="w-full btn-secondary mb-2"
          >
            {showSeed ? 'Hide' : 'Show'} Seed Phrase
          </button>
          {showSeed && seed && (
            <div className="mt-3 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
              <p className="text-xs text-yellow-200 mb-2">⚠️ Never share your seed phrase!</p>
              <p className="text-sm font-mono bg-gray-800 p-3 rounded break-all">{seed}</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Auto-Lock Timer</h3>
          <div className="grid grid-cols-2 gap-2">
            {[10, 15, 30, 60].map((minutes) => (
              <button
                key={minutes}
                onClick={() => handleAutoLockChange(minutes)}
                className={`py-2 px-4 rounded-lg transition-colors ${
                  autoLockTime === minutes
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <button
            onClick={handleLock}
            className="w-full btn-secondary"
          >
            Lock Wallet Now
          </button>
        </div>
      </div>
    </div>
  );
};
