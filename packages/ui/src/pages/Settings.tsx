import React, { useState, useEffect } from 'react';
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleAutoLockChange = async (minutes: number) => {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'SET_AUTO_LOCK_TIME',
        data: { minutes }
      });
      
      if (response.success) {
        setAutoLockMinutes(minutes);
        await chrome.storage.local.set({ autoLockMinutes: minutes });
        alert(`Auto-lock set to ${minutes} minutes`);
      }
    } catch (error) {
      console.error('Error setting auto-lock:', error);
    }
  };
  
  useEffect(() => {
    chrome.storage.local.get(['autoLockMinutes']).then((result) => {
      if (result.autoLockMinutes) {
        setAutoLockMinutes(Number(result.autoLockMinutes) || 5);
      }
    });
  }, []);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHANGE_PASSWORD',
        data: { currentPassword, newPassword }
      });
      
      if (response.success) {
        alert('Password changed successfully!');
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(response.error || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.message || 'Error changing password');
    }
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
        console.error('Error getting Solana private key:', error);
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
        console.error('Error getting Ethereum private key:', error);
        alert('Error retrieving private key');
      }
    } else {
      setShowEthPrivateKey(false);
      setEthPrivateKey('');
    }
  };

  return (
    <div className="p-4 pb-20">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      {/* Security Section */}
      <div className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 mb-4">
        <h3 className="text-lg font-semibold mb-4 text-purple-400">Security</h3>
        
        {/* Recovery Phrase */}
        <div className="mb-4">
          <button
            onClick={handleShowSeed}
            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left flex items-center justify-between"
          >
            <span className="font-medium">Recovery Phrase</span>
            <span className="text-gray-400">{showSeed ? '👁️ Hide' : '👁️‍🗨️ Show'}</span>
          </button>
          {showSeed && (
            <div className="mt-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/50">
              <p className="text-yellow-400 text-sm mb-2">⚠️ Never share your recovery phrase!</p>
              <p className="text-sm break-all font-mono bg-black/30 p-3 rounded">{seed}</p>
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
            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left flex items-center justify-between"
          >
            <span className="font-medium">Solana Private Key</span>
            <span className="text-gray-400">{showSolPrivateKey ? '👁️ Hide' : '👁️‍🗨️ Show'}</span>
          </button>
          {showSolPrivateKey && (
            <div className="mt-3 p-4 bg-red-500/10 rounded-lg border border-red-500/50">
              <p className="text-red-400 text-sm mb-2">🔐 Keep this private key secret!</p>
              <p className="text-sm break-all font-mono bg-black/30 p-3 rounded">{solPrivateKey}</p>
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
            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left flex items-center justify-between"
          >
            <span className="font-medium">Ethereum Private Key</span>
            <span className="text-gray-400">{showEthPrivateKey ? '👁️ Hide' : '👁️‍🗨️ Show'}</span>
          </button>
          {showEthPrivateKey && (
            <div className="mt-3 p-4 bg-red-500/10 rounded-lg border border-red-500/50">
              <p className="text-red-400 text-sm mb-2">🔐 Keep this private key secret!</p>
              <p className="text-sm break-all font-mono bg-black/30 p-3 rounded">{ethPrivateKey}</p>
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

      {/* Auto-lock Settings */}
      <div className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 mb-4">
        <h3 className="text-lg font-semibold mb-4 text-purple-400">Auto-Lock</h3>
        <p className="text-sm text-gray-400 mb-4">Lock wallet after inactivity</p>
        <div className="flex gap-2">
          {[1, 5, 15, 30, 60].map(mins => (
            <button
              key={mins}
              onClick={() => handleAutoLockChange(mins)}
              className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                autoLockMinutes === mins
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 mb-4">
        <h3 className="text-lg font-semibold mb-4 text-purple-400">Change Password</h3>
        {!showChangePassword ? (
          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
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
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleChangePassword}
                className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-all"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lock Wallet Button */}
      <div className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold mb-4 text-purple-400">Wallet Control</h3>
        <button
          onClick={async () => {
            await lockWallet();
          }}
          className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Lock Wallet
        </button>
      </div>
    </div>
  );
};
