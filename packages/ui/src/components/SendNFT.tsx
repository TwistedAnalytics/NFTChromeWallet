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
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Determine the chain from NFT data
  const chain = nft.chain || (nft.mint ? 'solana' : 'ethereum');
  const isSolana = chain === 'solana';
  const isEthereum = chain === 'ethereum';

  // Validate Solana address (base58, 32-44 characters)
  const isValidSolanaAddress = (address: string): boolean => {
    if (!address) return false;
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return solanaRegex.test(address);
  };

  // Validate Ethereum address (0x + 40 hex chars)
  const isValidEthereumAddress = (address: string): boolean => {
    if (!address) return false;
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethRegex.test(address);
  };

  const validateAddress = (): { valid: boolean; error?: string } => {
    if (!toAddress.trim()) {
      return { valid: false, error: 'Please enter a recipient address' };
    }

    if (isSolana) {
      if (!isValidSolanaAddress(toAddress)) {
        return { 
          valid: false, 
          error: 'Invalid Solana address. Must be 32-44 characters (base58 encoded)' 
        };
      }
    } else if (isEthereum) {
      if (!isValidEthereumAddress(toAddress)) {
        return { 
          valid: false, 
          error: 'Invalid Ethereum address. Must start with 0x and be 42 characters long' 
        };
      }
    }

    return { valid: true };
  };

  const handleSend = async () => {
    const validation = validateAddress();
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid address');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const result = await onSend(toAddress);

      if (result.success) {
        setTxHash(result.txHash || null);
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to send NFT');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send NFT');
    } finally {
      setIsSending(false);
    }
  };

  const getPlaceholder = () => {
    if (isSolana) return 'Enter Solana address (e.g., 7xKX...)';
    if (isEthereum) return 'Enter Ethereum address (0x...)';
    return 'Enter recipient address';
  };

  const getChainBadgeColor = () => {
    if (isSolana) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (isEthereum) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getExplorerUrl = () => {
    if (!txHash) return '';
    if (isSolana) return `https://solscan.io/tx/${txHash}`;
    if (isEthereum) return `https://etherscan.io/tx/${txHash}`;
    return '';
  };

  // Success Screen
  if (success) {
    return (
      <div className="p-4">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">NFT Sent!</h2>
        </div>

        {/* Success Icon and Message */}
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-green-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-white">Transaction Sent!</h3>
            <p className="text-sm text-gray-400">
              Your NFT has been sent successfully
            </p>
          </div>

          {/* NFT Preview */}
          <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-700">
            {nft.metadata?.image ? (
              <img 
                src={nft.metadata.image} 
                alt={nft.metadata?.name || 'NFT'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500 text-xs">No Image</span>
              </div>
            )}
          </div>

          {/* NFT Name */}
          <p className="text-sm font-medium text-white">
            {nft.metadata?.name || 'Unknown NFT'}
          </p>

          {/* Chain Badge */}
          <span className={`px-3 py-1 text-xs font-medium border rounded-full ${getChainBadgeColor()}`}>
            {isSolana ? 'Solana' : isEthereum ? 'Ethereum' : 'Unknown'}
          </span>
        </div>

        {/* Transaction Hash */}
        {txHash && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Transaction Hash</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-white font-mono truncate flex-1">
                {txHash.slice(0, 8)}...{txHash.slice(-8)}
              </p>
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-xs text-indigo-400 hover:text-indigo-300 whitespace-nowrap"
              >
                View →
              </a>
            </div>
          </div>
        )}

        {/* Note */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400">
            ℹ️ Your transaction is being confirmed on the blockchain. This may take a few moments.
          </p>
        </div>

        {/* Go Home Button */}
        <button
          onClick={onBack}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  // Send Form Screen
  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-3 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-white">Send NFT</h2>
      </div>

      {/* NFT Preview */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0">
            {nft.metadata?.image ? (
              <img 
                src={nft.metadata.image} 
                alt={nft.metadata?.name || 'NFT'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500 text-xs">No Image</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {nft.metadata?.name || 'Unknown NFT'}
            </h3>
            <p className="text-xs text-gray-400 truncate">
              {nft.contract?.name || 'Unknown Collection'}
            </p>
            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium border rounded ${getChainBadgeColor()}`}>
              {isSolana ? 'Solana' : isEthereum ? 'Ethereum' : 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Recipient Address Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Recipient Address
        </label>
        <input
          type="text"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          placeholder={getPlaceholder()}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={isSending}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={isSending || !toAddress.trim()}
        className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${
          isSending || !toAddress.trim()
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {isSending ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending...
          </span>
        ) : (
          'Send NFT'
        )}
      </button>

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-xs text-yellow-400">
          ⚠️ Double-check the recipient address. NFT transfers cannot be reversed.
        </p>
      </div>
    </div>
  );
};
