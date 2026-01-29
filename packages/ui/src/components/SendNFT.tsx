import React, { useState } from 'react';
import type { NFT } from '@nft-wallet/shared';

interface SendNFTProps {
  nft: NFT;
  onBack: () => void;
  onSend: (toAddress: string) => Promise<{ success: boolean; error?: string; txHash?: string }>;
}

export const SendNFT: React.FC<SendNFTProps> = ({ nft, onBack, onSend }) => {
  const [toAddress, setToAddress] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleSend = async () => {
    if (!toAddress || toAddress.length !== 42 || !toAddress.startsWith('0x')) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setIsSending(true);
    setError(null);
    setTxHash(null);

    const result = await onSend(toAddress);

    setIsSending(false);

    if (result.success) {
      setTxHash(result.txHash || null);
      setTimeout(() => {
        onBack();
      }, 2000);
    } else {
      setError(result.error || 'Failed to send NFT');
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-indigo-400 hover:text-indigo-300 transition-colors"
        disabled={isSending}
      >
        ← Back
      </button>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Send NFT</h2>

        <div className="mb-4 flex items-center gap-3">
          <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
            {nft.metadata?.image ? (
              <img
                src={nft.metadata.image}
                alt={nft.metadata.name || 'NFT'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                No Image
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold">{nft.metadata?.name || `#${nft.tokenId}`}</h3>
            <p className="text-sm text-gray-400">{nft.contract.name || 'Unknown'}</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Recipient Address</label>
          <input
            type="text"
            className="input-field"
            placeholder="0x..."
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            disabled={isSending}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        {txHash && (
          <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-sm">
            Transaction sent! Hash: {txHash.slice(0, 10)}...
          </div>
        )}

        <button
          onClick={handleSend}
          className="btn-primary w-full"
          disabled={isSending || !toAddress}
        >
          {isSending ? 'Sending...' : 'Send NFT'}
        </button>
      </div>
    </div>
  );
};
