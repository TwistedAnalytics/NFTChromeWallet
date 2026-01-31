import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigation } from '../contexts/NavigationContext';

export const Settings: React.FC = () => {
  const { lockWallet } = useWallet();
  const { navigate } = useNavigation();
  const [showSeed, setShowSeed] = useState(false);
  const [seed, setSeed] = useState('');
  const [showSolPrivateKey, setShowSolPrivateKey] = useState(false);
  const [solPrivateKey, setSolPrivateKey] = useState('');
  const [showEthPrivateKey, setShowEthPrivateKey] = useState(false);
  const [ethPrivateKey, setEthPrivateKey] = useState('');

  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
const [showChangePassword, setShowChangePassword] = useState(false);
const [currentPassword, setCurrentPassword] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');

const handleAutoLockChange = async (minutes: number) => {
  try {
    await chrome.runtime.sendMessage({ 
      type: 'SET_AUTO_LOCK_TIME',
      data: { minutes }
    });
    setAutoLockMinutes(minutes);
    alert(`Auto-lock set to ${minutes} minutes`);
  } catch (error) {
    console.error('Error setting auto-lock:', error);
  }
};

const handleChangePassword = async () => {
  if (newPassword !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  if (newPassword.length < 8) {
    alert('Password must be at least 8 characters');
    return;
  }
  // TODO: Implement password change in background
  alert('Password change not yet implemented');
  setShowChangePassword(false);
  setCurrentPassword('');
  setNewPassword('');
  setConfirmPassword('');
};

  const handleShowSeed = async () => {
    if (!showSeed) {
      try {
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

  const handleShowSolPrivateKey = async () => {
    if (!showSolPrivateKey) {
      try {
        const response = await chrome.runtime.sendMessage({ 
          type: 'GET_PRIVATE_KEY',
          data: { chain: 'solana' }
        });
        if (response.success) {
          setSolPrivateKey(response.data.privateKey);
          setShowSolPrivateKey(true);
        } else {
          alert('Failed to retrieve private key');
        }
      } catch (error) {
        console.error('Error getting private key:', error);
        alert('Error retrieving private key');
      }
    } else {
      setShowSolPrivateKey(false);
      setSolPrivateKey('');
    }
  };

  const handleShowEthPrivateKey = async () => {
    if (!showEthPrivateKey) {
      try {
        const response = await chrome.runtime.sendMessage({ 
          type: 'GET_PRIVATE_KEY',
          data: { chain: 'ethereum' }
        });
        if (response.success) {
          setEthPrivateKey(response.data.privateKey);
          setShowEthPrivateKey(true);
        } else {
          alert('Failed to retrieve private key');
        }
      } catch (error) {
        console.error('Error getting private key:', error);
        alert('Error retrieving private key');
      }
    } else {
      setShowEthPrivateKey(false);
      setEthPrivateKey('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
      <div className="p-4 max-h-[550px] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      {/* Security Section */}
      <div className="card mb-4">
        <h3 className="text-lg font-semibold mb-3 text-purple-400">Security</h3>
        
        {/* Recovery Phrase */}
        <div className="mb-4">
          <button
            onClick={handleShowSeed}
            className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left flex items-center justify-between"
          >
            <span className="font-medium">Recovery Phrase</span>
            <span className="text-gray-400">{showSeed ? '👁️ Hide' : '👁️‍🗨️ Show'}</span>
          </button>
          {showSeed && (
            <div className="mt-3 p-4 bg-gray-800 rounded-lg border border-yellow-500">
              <p className="text-yellow-400 text-sm mb-2">⚠️ Never share your recovery phrase!</p>
              <p className="text-sm break-all font-mono bg-gray-900 p-3 rounded">{seed}</p>
              <button
                onClick={() => copyToClipboard(seed)}
                className="mt-2 text-sm text-purple-400 hover:text-purple-300"
              >
                📋 Copy to Clipboard
              </button>
            </div>
          )}
        </div>

        {/* Solana Private Key */}
        <div className="mb-4">
          <button
            onClick={handleShowSolPrivateKey}
            className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left flex items-center justify-between"
          >
            <span className="font-medium">Solana Private Key</span>
            <span className="text-gray-400">{showSolPrivateKey ? '👁️ Hide' : '👁️‍🗨️ Show'}</span>
          </button>
          {showSolPrivateKey && (
            <div className="mt-3 p-4 bg-gray-800 rounded-lg border border-red-500">
              <p className="text-red-400 text-sm mb-2">🔐 Keep this private key secret!</p>
              <p className="text-sm break-all font-mono bg-gray-900 p-3 rounded">{solPrivateKey}</p>
              <button
                onClick={() => copyToClipboard(solPrivateKey)}
                className="mt-2 text-sm text-purple-400 hover:text-purple-300"
              >
                📋 Copy to Clipboard
              </button>
            </div>
          )}
        </div>

        {/* Ethereum Private Key */}
        <div className="mb-4">
          <button
            onClick={handleShowEthPrivateKey}
            className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left flex items-center justify-between"
          >
            <span className="font-medium">Ethereum Private Key</span>
            <span className="text-gray-400">{showEthPrivateKey ? '👁️ Hide' : '👁️‍🗨️ Show'}</span>
          </button>
          {showEthPrivateKey && (
            <div className="mt-3 p-4 bg-gray-800 rounded-lg border border-red-500">
              <p className="text-red-400 text-sm mb-2">🔐 Keep this private key secret!</p>
              <p className="text-sm break-all font-mono bg-gray-900 p-3 rounded">{ethPrivateKey}</p>
              <button
                onClick={() => copyToClipboard(ethPrivateKey)}
                className="mt-2 text-sm text-purple-400 hover:text-purple-300"
              >
                📋 Copy to Clipboard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Lock Timer */}
<div className="card mb-4">
  <h3 className="text-lg font-semibold mb-3 text-purple-400">Auto-Lock Timer</h3>
  <div className="space-y-2">
    {[5, 10, 15].map((minutes) => (
      <button
        key={minutes}
        onClick={() => handleAutoLockChange(minutes)}
        className={`w-full px-4 py-3 rounded-lg transition-colors text-left flex items-center justify-between ${
          autoLockMinutes === minutes
            ? 'bg-purple-600 hover:bg-purple-700'
            : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        <span className="font-medium">{minutes} Minutes</span>
        {autoLockMinutes === minutes && <span>✓</span>}
      </button>
    ))}
  </div>
</div>

{/* Change Password */}
<div className="card mb-4">
  <h3 className="text-lg font-semibold mb-3 text-purple-400">Change Password</h3>
  {!showChangePassword ? (
    <button
      onClick={() => setShowChangePassword(true)}
      className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium"
    >
      Change Password
    </button>
  ) : (
    <div className="space-y-3">
      <input
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="input w-full"
      />
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="input w-full"
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="input w-full"
      />
      <div className="flex gap-2">
        <button
          onClick={handleChangePassword}
          className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-medium"
        >
          Update
        </button>
        <button
          onClick={() => setShowChangePassword(false)}
          className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  )}
</div>

      {/* Actions */}
      <div className="card">
        <button
          onClick={async () => {
            await lockWallet();
            navigate('home');
          }}
          className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
        >
          🔒 Lock Wallet
        </button>
      </div>
    </div>
  );
};
