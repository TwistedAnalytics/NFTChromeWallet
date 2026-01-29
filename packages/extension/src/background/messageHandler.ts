import { WalletEngine } from '@nft-wallet/core';
import { MessageSchema, WalletCreateSchema, WalletUnlockSchema } from '@nft-wallet/shared';
import type { Message, MessageResponse, WalletState, VaultData } from '@nft-wallet/shared';
import { checkPermission, requestPermission, revokePermission, listPermissions } from './permissionManager.js';

// Global wallet engine instance
let walletEngine: WalletEngine | null = null;

// Storage keys
const STORAGE_KEYS = {
  VAULT_DATA: 'vaultData',
  WALLET_STATE: 'walletState',
  NFT_CACHE: 'nftCache',
};

/**
 * Get wallet engine (initialize if needed)
 */
async function getWalletEngine(): Promise<WalletEngine> {
  if (!walletEngine) {
    // Load state from storage
    const result = await chrome.storage.local.get([STORAGE_KEYS.WALLET_STATE]);
    const state = result[STORAGE_KEYS.WALLET_STATE] || undefined;
    walletEngine = new WalletEngine(state);
  }
  return walletEngine;
}

/**
 * Save wallet state to storage
 */
async function saveWalletState(state: WalletState): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.WALLET_STATE]: state,
  });
}

/**
 * Handle incoming messages
 */
export async function handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<MessageResponse> {
  try {
    // Validate message
    const validatedMessage = MessageSchema.parse(message);
    const engine = await getWalletEngine();

    switch (validatedMessage.type) {
      // Wallet lifecycle
      case 'WALLET_CREATE': {
        const data = WalletCreateSchema.parse(validatedMessage.data);
        const vaultData = await engine.createWallet(data.password, data.mnemonic);
        const state = engine.getState();
        await saveWalletState(state);
        await chrome.storage.local.set({ [STORAGE_KEYS.VAULT_DATA]: vaultData });
        return { success: true, data: state };
      }

      case 'WALLET_IMPORT': {
        const data = WalletCreateSchema.parse(validatedMessage.data);
        if (!data.mnemonic) {
          throw new Error('Mnemonic is required for import');
        }
        const vaultData = await engine.importWallet(data.password, data.mnemonic);
        const state = engine.getState();
        await saveWalletState(state);
        await chrome.storage.local.set({ [STORAGE_KEYS.VAULT_DATA]: vaultData });
        return { success: true, data: state };
      }

      case 'WALLET_UNLOCK': {
        const data = WalletUnlockSchema.parse(validatedMessage.data);
        const result = await chrome.storage.local.get([STORAGE_KEYS.VAULT_DATA]);
        const vaultData: VaultData = result[STORAGE_KEYS.VAULT_DATA];
        if (!vaultData) {
          throw new Error('No vault data found');
        }
        await engine.unlockWallet(vaultData, data.password);
        const state = engine.getState();
        await saveWalletState(state);
        return { success: true, data: state };
      }

      case 'WALLET_LOCK': {
        engine.lockWallet();
        const state = engine.getState();
        await saveWalletState(state);
        return { success: true, data: state };
      }

      case 'WALLET_GET_STATE': {
        const state = engine.getState();
        return { success: true, data: state };
      }

      // Account management
      case 'ACCOUNT_GET_CURRENT': {
        const { chain } = validatedMessage.data;
        const account = engine.getCurrentAccount(chain);
        return { success: true, data: account };
      }

      // NFT operations
      case 'NFT_FETCH_ALL': {
        // In production, this would fetch NFTs from chains
        const result = await chrome.storage.local.get([STORAGE_KEYS.NFT_CACHE]);
        const nfts = result[STORAGE_KEYS.NFT_CACHE] || [];
        return { success: true, data: nfts };
      }

      case 'NFT_GET_CACHED': {
        const result = await chrome.storage.local.get([STORAGE_KEYS.NFT_CACHE]);
        const nfts = result[STORAGE_KEYS.NFT_CACHE] || [];
        return { success: true, data: nfts };
      }

      // Settings
      case 'SETTINGS_UPDATE': {
        engine.updateSettings(validatedMessage.data);
        const state = engine.getState();
        await saveWalletState(state);
        return { success: true, data: state.settings };
      }

      case 'SETTINGS_GET': {
        const settings = engine.getSettings();
        return { success: true, data: settings };
      }

      // Permissions
      case 'PERMISSION_REQUEST': {
        const origin = sender.origin || sender.url || 'unknown';
        const granted = await requestPermission({ ...validatedMessage.data, origin });
        return { success: true, data: granted };
      }

      case 'PERMISSION_CHECK': {
        const origin = sender.origin || sender.url || 'unknown';
        const hasPermission = await checkPermission(origin, validatedMessage.data.chain);
        return { success: true, data: hasPermission };
      }

      case 'PERMISSION_REVOKE': {
        await revokePermission(validatedMessage.data.origin);
        return { success: true };
      }

      case 'PERMISSION_LIST': {
        const permissions = await listPermissions();
        return { success: true, data: permissions };
      }

      // Signing
      case 'SIGN_MESSAGE': {
        const { message: msg, chain, address } = validatedMessage.data;
        const signature = await engine.signMessage(msg, chain, address);
        return { success: true, data: signature };
      }

      case 'SIGN_TRANSACTION': {
        const { transaction, chain, address } = validatedMessage.data;
        const signedTx = await engine.signTransaction(transaction, chain, address);
        return { success: true, data: signedTx };
      }

      default:
        return { success: false, error: `Unknown message type: ${validatedMessage.type}` };
    }
  } catch (error: any) {
    console.error('Error in message handler:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}
