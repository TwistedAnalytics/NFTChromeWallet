import React from 'react';
import type { NFT } from '@nft-wallet/shared';
import { CopyButton } from './CopyButton';

interface NFTDetailProps {
  nft: NFT;
  onBack: () => void;
  onSend: () => void;
}

export const NFTDetail: React.FC<NFTDetailProps> = ({ nft, onBack, onSend }) => {
  const attributes = nft.metadata?.attributes || [];

  return (
  <div className="max-h-[550px] overflow-y-auto">
    <div className="card">
      <div className="aspect-square bg-gray-700 rounded-lg mb-4 overflow-hidden max-w-full">
        {nft.metadata?.image ? (
          <img
            src={nft.metadata.image}
            alt={nft.metadata.name || 'NFT'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-2">
        {nft.metadata?.name || `#${nft.tokenId}`}
      </h2>
      <p className="text-gray-400 mb-4">
        {nft.contract?.name || 'Unknown Collection'}
      </p>

      {nft.metadata?.description && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
          <p className="text-sm text-gray-300">{nft.metadata.description}</p>
        </div>
      )}

      {attributes.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Attributes</h3>
          <div className="grid grid-cols-2 gap-2">
            {attributes.map((attr, idx) => (
              <div key={idx} className="bg-gray-700 rounded p-2">
                <div className="text-xs text-gray-400">{attr.trait_type}</div>
                <div className="text-sm font-semibold">{attr.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

     <div className="mb-4">
  <h3 className="text-sm font-semibold text-gray-400 mb-2">Details</h3>
  <div className="space-y-2 text-sm">
    {nft.chain && (
      <div className="flex justify-between">
        <span className="text-gray-400">Blockchain:</span>
        <span className="font-semibold capitalize">{nft.chain}</span>
      </div>
    )}
    <div className="flex justify-between items-start">
      <span className="text-gray-400 flex-shrink-0">Contract Address:</span>
      <span className="font-mono text-xs text-right break-all ml-2">
        {nft.contract?.address?.slice(0, 6)}...{nft.contract?.address?.slice(-4)}
      </span>
    </div>
    <div className="flex justify-between items-start">
      <span className="text-gray-400 flex-shrink-0">Token ID:</span>
      <span className="font-mono text-xs text-right break-all ml-2 max-w-[200px]">
        {nft.tokenId?.length > 20 ? `${nft.tokenId.slice(0, 10)}...${nft.tokenId.slice(-10)}` : nft.tokenId}
      </span>
    </div>
    {nft.contract?.tokenType && (
      <div className="flex justify-between items-start">
        <span className="text-gray-400 flex-shrink-0">Token Standard:</span>
        <span className="text-xs text-right break-all ml-2">{nft.contract.tokenType}</span>
      </div>
    )}
  </div>
</div>

      <button onClick={onSend} className="btn-primary w-full">
        Send NFT
      </button>
    </div>
  </div>
);
};
