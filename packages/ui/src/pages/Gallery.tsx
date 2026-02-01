import React, { useState, useMemo } from 'react';
import { NFTGallery } from '../components/NFTGallery';
import { useNFTs } from '../hooks/useNFTs';
import { useNavigation } from '../contexts/NavigationContext';
import type { NFT } from '@nft-wallet/shared';

interface Collection {
  name: string;
  key: string; // Unique identifier for the collection
  nfts: NFT[];
  image?: string;
  floorPrice?: string;
}

export const Gallery: React.FC = () => {
  const { nfts, isLoading, fetchNFTs } = useNFTs();
  const { navigate } = useNavigation();
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  // Group NFTs by collection using proper collection identifiers
  const collections = useMemo(() => {
    const collectionMap = new Map<string, Collection>();

    nfts.forEach((nft) => {
      // Try to get collection from multiple sources (prioritize collection info from API)
      let collectionKey = '';
      let collectionName = 'Unknown Collection';
      
      // For Solana NFTs - use grouping data from Helius
      if (nft.raw?.grouping) {
        const collectionGroup = nft.raw.grouping.find((g: any) => g.group_key === 'collection');
        if (collectionGroup) {
          collectionKey = collectionGroup.group_value;
          collectionName = nft.contract?.name || collectionGroup.group_value.slice(0, 8);
        }
      }
      
      // For Ethereum NFTs - use contract address
      if (!collectionKey && nft.contract?.address) {
        collectionKey = nft.contract.address;
        collectionName = nft.contract.name || `Contract ${nft.contract.address.slice(0, 6)}`;
      }
      
      // Fallback to contract address if no collection found
      if (!collectionKey) {
        collectionKey = nft.contract?.address || nft.mint || nft.id || 'unknown';
      }
      
      if (!collectionMap.has(collectionKey)) {
        collectionMap.set(collectionKey, {
          name: collectionName,
          key: collectionKey,
          nfts: [],
          image: nft.metadata?.image || nft.raw?.content?.links?.image,
        });
      }
      
      collectionMap.get(collectionKey)!.nfts.push(nft);
    });

    // Sort by number of NFTs (most first)
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
    const collection = collections.find(c => c.key === selectedCollection);
    if (!collection) {
      setSelectedCollection(null);
      return null;
    }

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">{collection.name}</h2>
              <p className="text-xs text-gray-400">{collection.nfts.length} item{collection.nfts.length !== 1 ? 's' : ''}</p>
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Collections</h2>
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
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className="text-gray-400 mt-2 text-sm">Loading collections...</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400">No NFTs found</p>
          <p className="text-sm text-gray-500 mt-2">Your NFT collections will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {collections.map((collection) => (
            <button
              key={collection.key}
              onClick={() => setSelectedCollection(collection.key)}
              className="w-full card hover:bg-white/5 transition-all cursor-pointer group text-left p-3"
            >
              <div className="flex items-center gap-3">
                {/* Collection Image */}
                <div className="w-14 h-14 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                  {collection.image ? (
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Collection Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors text-sm">
                    {collection.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {collection.nfts.length} item{collection.nfts.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Arrow */}
                <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
