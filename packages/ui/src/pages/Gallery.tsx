import React from 'react';
import { NFTGallery } from '../components/NFTGallery';
import { useNFTs } from '../hooks/useNFTs';
import { useNavigation } from '../contexts/NavigationContext';

export const Gallery: React.FC = () => {
  const { nfts, isLoading, fetchNFTs } = useNFTs();
  const { navigate } = useNavigation();

  const handleNFTClick = (nft: any) => {
    navigate('nft-detail', { nft });
  };

  const handleRefresh = () => {
    fetchNFTs(true); // Force refresh
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">NFT Gallery</h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
          title="Refresh NFTs"
        >
          <svg className={`w-5 h-5 text-purple-400 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {isLoading && nfts.length === 0 ? (
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
