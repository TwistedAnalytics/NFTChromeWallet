import React from 'react';
import { NFTDetail } from '../components/NFTDetail';
import { useNavigate } from '../hooks/useNavigate';
import type { NFT } from '@nft-wallet/shared';

interface NFTViewProps {
  nft: NFT;
}

export const NFTView: React.FC<NFTViewProps> = ({ nft }) => {
  const navigate = useNavigate();

  return (
    <NFTDetail
      nft={nft}
      onBack={() => navigate('gallery')}
      onSend={() => navigate('send', { nft })}
    />
  );
};
