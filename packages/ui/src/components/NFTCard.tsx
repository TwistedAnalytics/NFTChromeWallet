import React from 'react';
import type { NFT } from '@nft-wallet/shared';

interface NFTCardProps {
  nft: NFT;
  onClick: () => void;
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft, onClick }) => {
  return (
    <div
      className="card cursor-pointer hover:border-indigo-500 transition-colors"
      onClick={onClick}
    >
      <div className="aspect-square bg-gray-700 rounded-lg mb-3 overflow-hidden">
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
      <h3 className="font-semibold truncate">
        {nft.metadata?.name || `#${nft.tokenId}`}
      </h3>
      <p className="text-sm text-gray-400 truncate">
        {nft.contract.name || 'Unknown Collection'}
      </p>
    </div>
  );
};
