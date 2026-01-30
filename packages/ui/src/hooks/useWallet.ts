import { useEffect, useCallback } from 'react';
import { useWalletStore } from '../store/walletStore';
import { useMessaging } from './useMessaging';
import type { Network } from '@nft-wallet/shared';

export const useWallet = () => {
  const store = useWalletStore();
  const { send } = useMessaging();

  const initialize = useCallback(async () => {
  store.setLoading(true);
  try {
    const statusResponse = await send({ type: 'GET_STATUS' });
    if (statusResponse.success && statusResponse.data) {
      store.setUnlocked(statusResponse.data.isUnlocked);
      if (statusResponse.data.isUnlocked) {
        store.setAddress(statusResponse.data.address || null);
        store.setCurrentNetwork(statusResponse.data.network || 'mainnet');
        
        // Make these calls in parallel instead of sequential
        const [balanceResponse, sitesResponse] = await Promise.all([
          send({ type: 'GET_BALANCE' }),
          send({ type: 'GET_CONNECTED_SITES' })
        ]);
        
        if (balanceResponse.success && balanceResponse.data) {
          store.setBalance(balanceResponse.data.balance);
        }

        if (sitesResponse.success && sitesResponse.data) {
          store.setConnectedSites(sitesResponse.data.sites);
        }
      }
    }
  } catch (error) {
    store.setError(error instanceof Error ? error.message : 'Failed to initialize wallet');
  } finally {
    store.setLoading(false);
  }
}, [send]);

  const createWallet = useCallback(async (password: string, mnemonic?: string) => {
  store.setLoading(true);
  store.setError(null);
  try {
    console.log('Creating wallet...');
    const response = await send({
      type: 'WALLET_CREATE',
      data: { password, mnemonic },
    });
    
    console.log('Create wallet response:', response);
    
    if (response.success && response.data) {
      store.setUnlocked(true);
      store.setAddress(response.data.address);
      store.setEthAddress(response.data.ethAddress);  // Add this
      console.log('Wallet created - SOL:', response.data.address, 'ETH:', response.data.ethAddress);
      return { success: true, mnemonic: response.data.mnemonic };
    } else {
      store.setError(response.error || 'Failed to create wallet');
      return { success: false, error: response.error };
    }
  } catch (error) {
    console.error('Create wallet error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to create wallet';
    store.setError(errorMsg);
    return { success: false, error: errorMsg };
  } finally {
    store.setLoading(false);
  }
}, [send]);

  const unlockWallet = useCallback(async (password: string) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const response = await send({
        type: 'WALLET_UNLOCK',
        data: { password },
      });
    
      if (response.success && response.data) {
        store.setUnlocked(true);
        store.setAddress(response.data.address);
        store.setEthAddress(response.data.ethAddress);  // Add this
        console.log('Wallet unlocked - SOL:', response.data.address, 'ETH:', response.data.ethAddress);
        initialize().catch(console.error);
        return { success: true };
      } else {
        store.setError(response.error || 'Failed to unlock wallet');
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to unlock wallet';
      store.setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      store.setLoading(false);
    }
  }, [send, initialize]);
  
  const lockWallet = useCallback(async () => {
    const response = await send({ type: 'LOCK_WALLET' });
    if (response.success) {
      store.reset();
      }
    }, [send]);

  const switchNetwork = useCallback(async (network: Network) => {
    const response = await send({
      type: 'SWITCH_NETWORK',
      data: { network },
    });
    
    if (response.success) {
      store.setCurrentNetwork(network);
      await initialize();
    }
  }, [send, initialize]);

  const disconnectSite = useCallback(async (origin: string) => {
    const response = await send({
      type: 'DISCONNECT_SITE',
      data: { origin },
    });
    
    if (response.success) {
      store.setConnectedSites(store.connectedSites.filter(site => site !== origin));
    }
  }, [send]);

  return {
    ...store,
    initialize,
    createWallet,
    unlockWallet,
    lockWallet,
    switchNetwork,
    disconnectSite,
  };
};
