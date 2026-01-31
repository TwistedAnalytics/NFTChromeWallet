import { useState, useEffect, useCallback } from 'react';
import { useWalletStore } from '../store/walletStore';
import { useMessaging } from './useMessaging';
import type { NFT } from '@nft-wallet/shared';

export const useNFTs = () => {
  const { nfts, setNFTs, isUnlocked, address, ethAddress } = useWalletStore();
  const { send } = useMessaging();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = useCallback(async () => {
    if (!isUnlocked) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await send({ type: 'GET_NFTS' });
      if (response.success && response.data) {
        setNFTs(response.data.nfts);
      } else {
        setError(response.error || 'Failed to fetch NFTs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
    } finally {
      setIsLoading(false);
    }
  }, [isUnlocked, send, setNFTs]);

  const sendNFT = useCallback(async (tokenAddress: string, tokenId: string, toAddress: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await send({
        type: 'SEND_NFT',
        data: { tokenAddress, tokenId, toAddress },
      });
      
      if (response.success) {
        await fetchNFTs();
        return { success: true, txHash: response.data?.txHash };
      } else {
        setError(response.error || 'Failed to send NFT');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send NFT';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [send, fetchNFTs]);

  useEffect(() => {
    if (isUnlocked) {
      fetchNFTs();
    }
  }, [isUnlocked]);

  return {
    nfts,
    isLoading,
    error,
    fetchNFTs,
    sendNFT,
  };
};
