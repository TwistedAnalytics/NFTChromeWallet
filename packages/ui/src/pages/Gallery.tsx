import React, { useState, useMemo } from 'react';
import { NFTGallery } from '../components/NFTGallery';
import { useNFTs } from '../hooks/useNFTs';
import { useNavigation } from '../contexts/NavigationContext';
import type { NFT } from '@nft-wallet/shared';

interface Collection {
  name: string;
  address: string;
  nfts: NFT[];
  image?: string;
}

export const Gallery: React.FC = () => {
  const { nfts, isLoading, fetchNFTs } = useNFTs();
  const { navigate } = useNavigation();
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  // Group NFTs by collection
  const collections = useMemo(() => {
    const collectionMap = new Map<string, Collection>();

    nfts.forEach((nft) => {
      const address = nft.contract.address;
      const name = nft.contract.name || nft.collection?.name || 'Unknown Collection';
      
      if (!collectionMap.has(address)) {
        collectionMap.set(address, {
          name,
          address,
          nfts: [],
          image: nft.metadata?.image || nft.image?.cachedUrl || nft.image?.thumbnailUrl,
        });
      }
      
      collectionMap.get(address)!.nfts.push(nft);
    });

    return Array.from(collectionMap.values()).sort((a, b) => 
      b.nfts.length - a.nfts.length
    );
  }, [nfts]);

  const handleNFTClick = (nft: NFT) => {
    navigate('nft-detail', { nft });
  };

  const handleRefresh = () => {
    fetchNFTs(true);
  };

  const handleBack = () => {
    setSelectedCollection(null);
  };

  // Show individual NFTs if collection is selected
  if (selectedCollection) {
    const collection = collections.find(c => c.address === selectedCollection);
    if (!collection) {
      setSelectedCollection(null);
      return null;
    }

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold">{collection.name}</h2>
              <p className="text-sm text-gray-400">{collection.nfts.length} items</p>
            </div>
          </div>
        </div>

        <NFTGallery nfts={collection.nfts} onNFTClick={handleNFTClick} />
      </div>
    );
  }

  // Show collections view
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Collections</h2>
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

      {isLoading && collections.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <p className="text-gray-400 mt-2">Loading collections...</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="card text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400">No NFTs found</p>
          <p className="text-sm text-gray-500 mt-2">Your NFT collections will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {collections.map((collection) => (
            <button
              key={collection.address}
              onClick={() => setSelectedCollection(collection.address)}
              className="card hover:bg-white/5 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-4">
                {/* Collection Image */}
                <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                  {collection.image ? (
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
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

                {/* Collection Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {collection.nfts.length} {collection.nfts.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                {/* Arrow */}
                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
