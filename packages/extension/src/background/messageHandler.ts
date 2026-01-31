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
        console.log('WALLET_CREATE received');
        const data = WalletCreateSchema.parse(validatedMessage.data);
        const result = await engine.createWallet(data.password, data.mnemonic);
        const state = engine.getState();
        const solAccount = engine.getCurrentAccount('solana');
        const ethAccount = engine.getCurrentAccount('ethereum');
    
        await saveWalletState(state);
        await chrome.storage.local.set({ [STORAGE_KEYS.VAULT_DATA]: result.vaultData });
    
        console.log('Wallet created - SOL:', solAccount?.address, 'ETH:', ethAccount?.address);
    
        return { 
          success: true, 
          data: { 
            address: solAccount?.address,
            ethAddress: ethAccount?.address,
            mnemonic: !data.mnemonic ? result.mnemonic : undefined
          } 
        };
      }
      
      case 'WALLET_IMPORT': {
        console.log('WALLET_IMPORT received');
        const data = WalletCreateSchema.parse(validatedMessage.data);
        if (!data.mnemonic) {
          throw new Error('Mnemonic is required for import');
        }
        const result = await engine.importWallet(data.password, data.mnemonic);
        const state = engine.getState();
        const solAccount = engine.getCurrentAccount('solana');
        const ethAccount = engine.getCurrentAccount('ethereum');
    
        await saveWalletState(state);
        await chrome.storage.local.set({ [STORAGE_KEYS.VAULT_DATA]: result.vaultData });
    
        console.log('Wallet imported - SOL:', solAccount?.address, 'ETH:', ethAccount?.address);
    
        return { 
          success: true, 
          data: { 
            address: solAccount?.address,
            ethAddress: ethAccount?.address
          } 
        };
      }

      case 'WALLET_UNLOCK': {
        console.log('WALLET_UNLOCK received');
        const data = WalletUnlockSchema.parse(validatedMessage.data);
        const result = await chrome.storage.local.get([STORAGE_KEYS.VAULT_DATA]);
        const vaultData: VaultData = result[STORAGE_KEYS.VAULT_DATA];
        if (!vaultData) {
          throw new Error('No vault data found');
        }
        await engine.unlockWallet(vaultData, data.password);
        const state = engine.getState();
        const solAccount = engine.getCurrentAccount('solana');
        const ethAccount = engine.getCurrentAccount('ethereum');
  
        await saveWalletState(state);
  
        console.log('Wallet unlocked - SOL:', solAccount?.address, 'ETH:', ethAccount?.address);
  
        return { 
          success: true, 
          data: { 
            address: solAccount?.address,
            ethAddress: ethAccount?.address,
            isUnlocked: true
          } 
        };
      }


      case 'GET_BALANCE': {
  const state = engine.getState();
  const solAccount = engine.getCurrentAccount('solana');
  const ethAccount = engine.getCurrentAccount('ethereum');
  
  console.log('GET_BALANCE - SOL account:', solAccount?.address);
  console.log('GET_BALANCE - ETH account:', ethAccount?.address);
  
  let solBalance = '0.000000';
  let ethBalance = '0.000000';
  
  // Fetch SOL balance from Solana
  if (solAccount && state.isUnlocked) {
    try {
      // Try multiple RPC endpoints for reliability
      const rpcEndpoints = [
        'https://api.mainnet-beta.solana.com',
        'https://solana-api.projectserum.com',
        'https://rpc.ankr.com/solana'
      ];
      
      let fetchSuccess = false;
      for (const solanaRpc of rpcEndpoints) {
        try {
          console.log(`Trying Solana RPC: ${solanaRpc}`);
          const response = await fetch(solanaRpc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getBalance',
              params: [solAccount.address]
            })
          });
          
          const data = await response.json();
          console.log('SOL balance response:', data);
          
          if (data.result?.value !== undefined) {
            const lamports = data.result.value;
            solBalance = (lamports / 1_000_000_000).toFixed(6);
            console.log(`SOL balance: ${lamports} lamports = ${solBalance} SOL`);
            fetchSuccess = true;
            break;
          } else if (data.error) {
            console.error('RPC error:', data.error);
          }
        } catch (rpcError) {
          console.error(`Failed with ${solanaRpc}:`, rpcError);
        }
      }
      
      if (!fetchSuccess) {
        console.error('All Solana RPC endpoints failed');
      }
    } catch (error) {
      console.error('Failed to fetch SOL balance:', error);
    }
  } else {
    console.log('Skipping SOL balance fetch:', { 
      hasAccount: !!solAccount, 
      isUnlocked: state.isUnlocked 
    });
  }
  
  // Fetch ETH balance from Ethereum
  if (ethAccount && state.isUnlocked) {
    try {
      const ethRpc = 'https://eth.llamarpc.com';
      console.log('Fetching ETH balance for:', ethAccount.address);
      const response = await fetch(ethRpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [ethAccount.address, 'latest']
        })
      });
      const data = await response.json();
      console.log('ETH balance response:', data);
      if (data.result) {
        const weiBalance = BigInt(data.result);
        ethBalance = (Number(weiBalance) / 1e18).toFixed(6);
        console.log('ETH balance calculated:', ethBalance);
      }
    } catch (error) {
      console.error('Failed to fetch ETH balance:', error);
    }
  }
  
  return { 
    success: true, 
    data: { 
      balance: solBalance,
      ethBalance: ethBalance
    } 
  };
}
      

      case 'GET_MNEMONIC': {
        const state = engine.getState();
        if (!state.isUnlocked) {
          throw new Error('Wallet is locked');
        }
        const mnemonic = engine.getMnemonic();
        return { success: true, data: { mnemonic } };
      }

      case 'SET_AUTO_LOCK_TIME': {
        const { minutes } = validatedMessage.data;
        engine.setAutoLockTime(minutes);
        return { success: true };
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

      case 'GET_STATUS': {
        const state = engine.getState();
        const solAccount = engine.getCurrentAccount('solana');
        const ethAccount = engine.getCurrentAccount('ethereum');
        return { 
          success: true, 
          data: { 
            isUnlocked: state.isUnlocked,
            address: solAccount?.address || null,
            ethAddress: ethAccount?.address || null,
            network: state.settings.selectedNetwork.solana
          } 
        };
      }

      case 'GET_CONNECTED_SITES': {
        const permissions = await listPermissions();
        const sites = permissions.map(p => p.origin);
        return { success: true, data: { sites } };
      }

      case 'GET_NFTS': {
        const result = await chrome.storage.local.get([STORAGE_KEYS.NFT_CACHE]);
        const nfts = result[STORAGE_KEYS.NFT_CACHE] || [];
        return { success: true, data: { nfts } };
      }

      case 'ACCOUNT_GET_CURRENT': {
        const { chain } = validatedMessage.data;
        const account = engine.getCurrentAccount(chain);
        return { success: true, data: account };
      }

      case 'NFT_FETCH_ALL': {
        const result = await chrome.storage.local.get([STORAGE_KEYS.NFT_CACHE]);
        const nfts = result[STORAGE_KEYS.NFT_CACHE] || [];
        return { success: true, data: nfts };
      }

      case 'NFT_GET_CACHED': {
        const result = await chrome.storage.local.get([STORAGE_KEYS.NFT_CACHE]);
        const nfts = result[STORAGE_KEYS.NFT_CACHE] || [];
        return { success: true, data: nfts };
      }

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
