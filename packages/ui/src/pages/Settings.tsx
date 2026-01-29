import React from 'react';
import { NetworkSelector } from '../components/NetworkSelector';
import { ConnectedSites } from '../components/ConnectedSites';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from '../hooks/useNavigate';

export const Settings: React.FC = () => {
  const { currentNetwork, connectedSites, switchNetwork, disconnectSite, lockWallet } = useWallet();
  const navigate = useNavigate();

  const handleLock = async () => {
    await lockWallet();
    navigate('home');
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
        <NetworkSelector
          currentNetwork={currentNetwork}
          onNetworkChange={switchNetwork}
        />

        <ConnectedSites
          sites={connectedSites}
          onDisconnect={disconnectSite}
        />

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
