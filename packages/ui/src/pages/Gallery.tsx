import React from 'react';
import { NFTGallery } from '../components/NFTGallery';
import { useNFTs } from '../hooks/useNFTs';
import { useNavigate } from '../hooks/useNavigate';
import type { NFT } from '@nft-wallet/shared';

export const Gallery: React.FC = () => {
  const { nfts, isLoading, error, fetchNFTs } = useNFTs();
  const navigate = useNavigate();

  const handleNFTClick = (nft: NFT) => {
    navigate('nft-detail', { nft });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="text-gray-400 mt-4">Loading NFTs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchNFTs} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">My NFTs</h2>
        <button
          onClick={fetchNFTs}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Refresh
        </button>
      </div>
      <NFTGallery nfts={nfts} onNFTClick={handleNFTClick} />
    </div>
  );
};
