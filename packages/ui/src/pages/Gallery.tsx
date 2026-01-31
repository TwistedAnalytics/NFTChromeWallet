import React from 'react';
import { NFTGallery } from '../components/NFTGallery';
import { useNFTs } from '../hooks/useNFTs';
import { useNavigation } from '../contexts/NavigationContext';

export const Gallery: React.FC = () => {
  const { nfts, isLoading } = useNFTs();
  const { navigate } = useNavigation();

  const handleNFTClick = (nft: any) => {
    navigate('nft-detail', { nft });
  };

  return (
    <div>
      <button
        onClick={() => navigate('home')}
        className="mb-4 text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold mb-6">NFT Gallery</h2>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <p className="text-gray-400 mt-2">Loading NFTs...</p>
        </div>
      ) : nfts.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400">No NFTs found</p>
          <p className="text-sm text-gray-500 mt-2">Send some NFTs to your wallet address</p>
        </div>
      ) : (
        <NFTGallery nfts={nfts} onNFTClick={handleNFTClick} />
      )}
    </div>
  );
};
