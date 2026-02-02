import React from 'react';
import type { Network } from '@nft-wallet/shared';

interface NetworkSelectorProps {
  currentNetwork: Network;
  onNetworkChange: (network: Network) => void;
}

const networks = [
  { value: 'mainnet', label: 'Ethereum Mainnet' },
  { value: 'goerli', label: 'Goerli Testnet' },
  { value: 'sepolia', label: 'Sepolia Testnet' },
];

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  currentNetwork,
  onNetworkChange,
}) => {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Network</h3>
      <div className="space-y-2">
        {networks.map((network) => (
          <button
            key={network.value}
            onClick={() => onNetworkChange(network.value as any)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              currentNetwork === network.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            {network.label}
          </button>
        ))}
      </div>
    </div>
  );
};
