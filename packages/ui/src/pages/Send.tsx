import React from 'react';
import { SendNFT } from '../components/SendNFT';
import { useNFTs } from '../hooks/useNFTs';
import { useNavigation } from '../contexts/NavigationContext';
import type { NFT } from '@nft-wallet/shared';

interface SendProps {
  nft: NFT;
}

export const Send: React.FC<SendProps> = ({ nft }) => {
  const { sendNFT } = useNFTs();
  const { navigate } = useNavigation();

  const handleSend = async (to: string, amount: number) => {
    const result = await sendNFT(nft, to, amount);
    if (result.success) {
      navigate('gallery');
    }
    return result;
  };

  return (
    <div>
      <button
        onClick={() => navigate('nft-detail', { nft })}
        className="mb-4 text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold mb-6">Send NFT</h2>

      <SendNFT nft={nft} onSend={handleSend} />
    </div>
  );
};
