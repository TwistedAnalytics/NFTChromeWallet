import React from 'react';
import { NFTDetail } from '../components/NFTDetail';
import { useNavigation } from '../contexts/NavigationContext';
import type { NFT } from '@nft-wallet/shared';

interface NFTViewProps {
  nft: NFT;
}

export const NFTView: React.FC<NFTViewProps> = ({ nft }) => {
  const { navigate } = useNavigation();

  const handleSend = () => {
    navigate('send', { nft });
  };

  return (
    <div>
      <button
        onClick={() => navigate('gallery')}
        className="mb-4 text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        ← Back to Gallery
      </button>

      <NFTDetail nft={nft} onBack={() => navigate('gallery')} onSend={handleSend} />
    </div>
  );
};
