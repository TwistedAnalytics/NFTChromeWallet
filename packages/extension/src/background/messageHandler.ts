import { WalletEngine } from '@nft-wallet/core';
import { MessageSchema, WalletCreateSchema, WalletUnlockSchema } from '@nft-wallet/shared';
import type { Message, MessageResponse, WalletState, VaultData } from '@nft-wallet/shared';
import { checkPermission, requestPermission, revokePermission, listPermissions } from './permissionManager.js';
import { checkBalanceChanges, checkNFTChanges } from './notificationHandler.js';

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
    const result = await chrome.storage.local.get([STORAGE_KEYS.WALLET_STATE, STORAGE_KEYS.VAULT_DATA]);
    const state = result[STORAGE_KEYS.WALLET_STATE];
    
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
  
  let solBalance = '0.000000000';
  let ethBalance = '0.000000000';
  
  // Fetch SOL balance from Solana with timeout
  if (solAccount && state.isUnlocked) {
    try {
      const rpcEndpoints = [
        'https://rpc.helius.xyz/?api-key=647bbd34-42b3-418b-bf6c-c3a40813b41c',
        'https://rpc.ankr.com/solana',
        'https://solana-mainnet.core.chainstack.com/b6682c75a23d778300253783ba806bfe'
      ];
      
      let fetchSuccess = false;
      for (const solanaRpc of rpcEndpoints) {
        if (fetchSuccess) break;
        
        try {
          console.log(`Trying Solana RPC: ${solanaRpc}`);
          
          // Add 5 second timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(solanaRpc, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getBalance',
              params: [solAccount.address]
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.error(`HTTP ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          console.log('SOL balance response:', data);
          
          if (data.result?.value !== undefined) {
            const lamports = data.result.value;
            solBalance = (lamports / 1_000_000_000).toFixed(9);
            console.log(`✅ SOL balance: ${solBalance} SOL`);
            fetchSuccess = true;
            break;
          }
        } catch (rpcError: any) {
          if (rpcError.name === 'AbortError') {
            console.error(`⏱️ Timeout for ${solanaRpc}`);
          } else {
            console.error(`❌ Failed with ${solanaRpc}:`, rpcError.message);
          }
          continue;
        }
      }
      
      if (!fetchSuccess) {
        console.warn('⚠️ Could not fetch SOL balance from any RPC');
      }
    } catch (error) {
      console.error('Failed to fetch SOL balance:', error);
    }
  }
  
  // Fetch ETH balance from Ethereum with timeout
  if (ethAccount && state.isUnlocked) {
    try {
      const ethRpcEndpoints = [
        'https://rpc.ankr.com/eth',
        'https://ethereum.publicnode.com',
        'https://eth.llamarpc.com'
      ];
      
      let ethFetchSuccess = false;
      for (const ethRpc of ethRpcEndpoints) {
        if (ethFetchSuccess) break;
        
        try {
          console.log('Fetching ETH balance from:', ethRpc);
          
          // Add 5 second timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(ethRpc, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getBalance',
              params: [ethAccount.address, 'latest']
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.error(`ETH RPC HTTP ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          console.log('ETH balance response:', data);
          
          if (data.result) {
            const weiBalance = BigInt(data.result);
            ethBalance = (Number(weiBalance) / 1e18).toFixed(9);
            console.log('✅ ETH balance:', ethBalance);
            ethFetchSuccess = true;
            break;
          }
        } catch (ethRpcError: any) {
          if (ethRpcError.name === 'AbortError') {
            console.error(`⏱️ Timeout for ${ethRpc}`);
          } else {
            console.error(`❌ Failed with ${ethRpc}:`, ethRpcError.message);
          }
          continue;
        }
      }
      
      if (!ethFetchSuccess) {
        console.warn('⚠️ Could not fetch ETH balance from any RPC');
      }
    } catch (error) {
      console.error('Failed to fetch ETH balance:', error);
    }
  }
  
  // Check for balance changes and notify
  if (solAccount && ethAccount) {
    await checkBalanceChanges(solBalance, ethBalance, solAccount.address, ethAccount.address);
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

      case 'GET_PRIVATE_KEY': {
      const state = engine.getState();
      if (!state.isUnlocked) {
        throw new Error('Wallet is locked');
      }
      const { chain } = validatedMessage.data;
      const privateKey = engine.getPrivateKey(chain, 0);
      return { success: true, data: { privateKey } };
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
  const state = engine.getState();
  const solAccount = engine.getCurrentAccount('solana');
  const ethAccount = engine.getCurrentAccount('ethereum');
  
  if (!state.isUnlocked) {
    return { success: true, data: { nfts: [] } };
  }

  console.log('Fetching NFTs for SOL:', solAccount?.address, 'ETH:', ethAccount?.address);

  try {
    const allNfts: any[] = [];
    
    // Fetch Solana NFTs
    if (solAccount?.address) {
      try {
        const HELIUS_API_KEY = '647bbd34-42b3-418b-bf6c-c3a40813b41c';
        const heliusUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
        
        console.log('Fetching SOL NFTs for:', solAccount.address);
        
        const solResponse = await fetch(heliusUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'sol-nft',
            method: 'getAssetsByOwner',
            params: {
              ownerAddress: solAccount.address,
              page: 1,
              limit: 1000
            }
          })
        });
        
        const solData = await solResponse.json();
        console.log('Helius response:', solData);
        
        if (solData.result?.items) {
          const solNfts = solData.result.items.map((nft: any) => ({
            // Core identifiers
            id: nft.id,
            chain: 'solana',
            mint: nft.id,
            tokenId: nft.id,
            
            // Contract/Collection info
            contract: {
              address: nft.id,
              name: nft.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || 'Unknown Collection',
              tokenType: nft.interface || 'Unknown',
            },
            
            // Metadata
            metadata: {
              name: nft.content?.metadata?.name || `#${nft.id.slice(0, 8)}`,
              description: nft.content?.metadata?.description || '',
              image: nft.content?.links?.image || nft.content?.files?.[0]?.uri || '',
              attributes: nft.content?.metadata?.attributes || [],
              
              // Additional metadata
              symbol: nft.content?.metadata?.symbol || '',
              external_url: nft.content?.links?.external_url || '',
              animation_url: nft.content?.links?.animation_url || '',
            },
            
            // Ownership info
            ownership: {
              owner: nft.ownership?.owner || solAccount.address,
              frozen: nft.ownership?.frozen || false,
              delegated: nft.ownership?.delegated || false,
            },
            
            // Creators
            creators: nft.creators || [],
            
            // Royalty
            royalty: nft.royalty || {},
            
            // Compression (for cNFTs)
            compression: nft.compression || {},
            
            // Raw data for advanced use
            raw: nft,
          }));
          allNfts.push(...solNfts);
          console.log('Found', solNfts.length, 'Solana NFTs');
        }
      } catch (solError) {
        console.error('Solana NFT fetch error:', solError);
      }
    }
    
    // Fetch Ethereum NFTs
    if (ethAccount?.address) {
      try {
        const ALCHEMY_API_KEY = 'WD0X0NprnF2uHt6pb_dWC';
        const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
        
        console.log('Fetching ETH NFTs for:', ethAccount.address);
        
        const ethResponse = await fetch(`${alchemyUrl}/getNFTs/?owner=${ethAccount.address}`);
        const ethData = await ethResponse.json();
        
        console.log('Alchemy response:', ethData);
        
        if (ethData.ownedNfts) {
          const ethNfts = ethData.ownedNfts.map((nft: any) => ({
            // Core identifiers
            id: `${nft.contract.address}-${nft.id.tokenId}`,
            chain: 'ethereum',
            tokenId: nft.id.tokenId,
            
            // Contract info
            contract: {
              address: nft.contract.address,
              name: nft.contractMetadata?.name || nft.contract.name || 'Unknown',
              tokenType: nft.id.tokenMetadata?.tokenType || nft.contract.tokenType || 'ERC721',
              symbol: nft.contractMetadata?.symbol || '',
            },
            
            // Metadata
            metadata: {
              name: nft.title || nft.metadata?.name || nft.name || `#${nft.id.tokenId}`,
              description: nft.description || nft.metadata?.description || '',
              image: nft.media?.[0]?.gateway || nft.media?.[0]?.raw || nft.metadata?.image || '',
              attributes: nft.metadata?.attributes || nft.rawMetadata?.attributes || [],
              external_url: nft.metadata?.external_url || '',
              animation_url: nft.metadata?.animation_url || '',
            },
            
            // Additional info
            timeLastUpdated: nft.timeLastUpdated,
            balance: nft.balance || '1',
            
            // Raw data
            raw: nft,
          }));
          allNfts.push(...ethNfts);
          console.log('Found', ethNfts.length, 'Ethereum NFTs');
        }
      } catch (ethError) {
        console.error('Ethereum NFT fetch error:', ethError);
      }
    }
    
    console.log('Total NFTs found:', allNfts.length);
    
    // Cache results
    await chrome.storage.local.set({ [STORAGE_KEYS.NFT_CACHE]: allNfts });
    
    return { success: true, data: { nfts: allNfts } };
  } catch (error) {
    console.error('NFT fetch error:', error);
    const result = await chrome.storage.local.get([STORAGE_KEYS.NFT_CACHE]);
    return { success: true, data: { nfts: result[STORAGE_KEYS.NFT_CACHE] || [] } };
  }
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
