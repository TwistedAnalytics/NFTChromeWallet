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

  // Determine the chain from NFT data
  const chain = nft.chain || (nft.mint ? 'solana' : 'ethereum');
  const isSolana = chain === 'solana';
  const isEthereum = chain === 'ethereum';

  // Validate Solana address (base58, 32-44 characters)
  const isValidSolanaAddress = (address: string): boolean => {
    if (!address) return false;
    // Solana addresses are base58 encoded, typically 32-44 characters
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
    setTxHash(null);

    try {
      const result = await onSend(toAddress);

      if (result.success) {
        setTxHash(result.txHash || null);
        setTimeout(() => {
          onBack();
        }, 3000);
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

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-lg transition-all"
          disabled={isSending}
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold">Send NFT</h2>
      </div>

      <div className="card mb-4">
        {/* NFT Preview */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-700">
          <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
            {nft.metadata?.image || nft.raw?.content?.links?.image ? (
              <img
                src={nft.metadata?.image || nft.raw?.content?.links?.image}
                alt={nft.metadata?.name || 'NFT'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">
              {nft.metadata?.name || `#${nft.tokenId?.slice(0, 8)}`}
            </h3>
            <p className="text-sm text-gray-400 truncate">
              {nft.contract?.name || 'Unknown Collection'}
            </p>
            <div className={`inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-full border text-xs font-medium ${getChainBadgeColor()}`}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8"/>
              </svg>
              {chain === 'solana' ? 'Solana' : 'Ethereum'}
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-yellow-500 font-semibold text-sm">Important</p>
              <p className="text-gray-300 text-xs mt-1">
                {isSolana && 'This is a Solana NFT. Only send to a valid Solana wallet address. Sending to an Ethereum address will result in permanent loss.'}
                {isEthereum && 'This is an Ethereum NFT. Only send to a valid Ethereum wallet address (0x...). Sending to a Solana address will result in permanent loss.'}
              </p>
            </div>
          </div>
        </div>

        {/* Recipient Address Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Recipient {isSolana ? 'Solana' : 'Ethereum'} Address
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
            placeholder={getPlaceholder()}
            value={toAddress}
            onChange={(e) => {
              setToAddress(e.target.value.trim());
              setError(null); // Clear error on input
            }}
            disabled={isSending}
          />
          {toAddress && !isSending && (
            <div className="mt-2 text-xs">
              {validateAddress().valid ? (
                <p className="text-green-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Valid {isSolana ? 'Solana' : 'Ethereum'} address
                </p>
              ) : (
                <p className="text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Invalid address format
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {txHash && (
          <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-green-400 font-semibold text-sm">Transaction Sent!</p>
                <p className="text-gray-400 text-xs mt-1 font-mono break-all">
                  {txHash.slice(0, 16)}...{txHash.slice(-16)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={isSending || !toAddress || !validateAddress().valid}
          className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSending ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send NFT
            </>
          )}
        </button>
      </div>
    </div>
  );
};
