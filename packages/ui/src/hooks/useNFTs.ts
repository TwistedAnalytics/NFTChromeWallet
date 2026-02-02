import { useState, useEffect, useCallback } from 'react';
import { useWalletStore } from '../store/walletStore';
import { useMessaging } from './useMessaging';
import type { NFT } from '@nft-wallet/shared';

export const useNFTs = () => {
  const { nfts, setNFTs, isUnlocked, address, ethAddress } = useWalletStore();
  const { send } = useMessaging();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = useCallback(async (forceRefresh = false) => {
    if (!isUnlocked) return;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const result = await chrome.storage.local.get(['lastNFTFetch', 'cachedNFTs']);
      const lastFetch = result.lastNFTFetch || 0;
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for NFTs (they don't change often)

      if (now - lastFetch < CACHE_DURATION && result.cachedNFTs) {
      console.log('✅ Using cached NFTs (age:', Math.floor((now - lastFetch) / 1000), 'seconds)');
      setNFTs(Array.isArray(result.cachedNFTs) ? result.cachedNFTs : []);
        return;
      }
    }

    // Fetch fresh data
    console.log('⏳ Fetching fresh NFTs...');
    setIsLoading(true);
    setError(null);
    try {
      const response = await send({ type: 'GET_NFTS' });
      if (response.success && response.data) {
        setNFTs(response.data.nfts);
        
        // Cache the NFTs
        await chrome.storage.local.set({
          lastNFTFetch: Date.now(),
          cachedNFTs: response.data.nfts
        });
        
        console.log('✅ Fresh NFTs fetched and cached');
      } else {
        setError(response.error || 'Failed to fetch NFTs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
    } finally {
      setIsLoading(false);
    }
  }, [isUnlocked, send, setNFTs]);

  const sendNFT = useCallback(async (nft: NFT, toAddress: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await send({
        type: 'SEND_NFT',
        data: { 
          nft,
          tokenAddress: nft.contract?.address || nft.mint || nft.id,
          tokenId: nft.tokenId,
          toAddress 
        },
      });
      
      if (response.success) {
        // Clear cache and force refresh after sending
        await chrome.storage.local.remove(['lastNFTFetch', 'cachedNFTs']);
        await fetchNFTs(true);
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
      fetchNFTs(); // Will use cache if available
    }
  }, [isUnlocked, fetchNFTs]);

  return {
    nfts,
    isLoading,
    error,
    fetchNFTs,
    sendNFT,
  };
};
