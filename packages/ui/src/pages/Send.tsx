import React from 'react';
import { SendNFT } from '../components/SendNFT';
import { useNFTs } from '../hooks/useNFTs';
import { useNavigate } from '../hooks/useNavigate';
import type { NFT } from '@nft-wallet/shared';

interface SendProps {
  nft: NFT;
}

export const Send: React.FC<SendProps> = ({ nft }) => {
  const { sendNFT } = useNFTs();
  const navigate = useNavigate();

  const handleSend = async (toAddress: string) => {
    const result = await sendNFT(nft.contract.address, nft.tokenId, toAddress);
    return result;
  };

  return (
    <SendNFT
      nft={nft}
      onBack={() => navigate('nft-detail', { nft })}
      onSend={handleSend}
    />
  );
};
