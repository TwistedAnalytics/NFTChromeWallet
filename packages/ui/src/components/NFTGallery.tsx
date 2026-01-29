import React from 'react';
import type { NFT } from '@nft-wallet/shared';
import { NFTCard } from './NFTCard';

interface NFTGalleryProps {
  nfts: NFT[];
  onNFTClick: (nft: NFT) => void;
}

export const NFTGallery: React.FC<NFTGalleryProps> = ({ nfts, onNFTClick }) => {
  if (nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No NFTs found</p>
        <p className="text-gray-500 text-sm mt-2">
          Your collected NFTs will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {nfts.map((nft) => (
        <NFTCard
          key={`${nft.contract.address}-${nft.tokenId}`}
          nft={nft}
          onClick={() => onNFTClick(nft)}
        />
      ))}
    </div>
  );
};
