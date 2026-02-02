import { WalletEngine } from '@nft-wallet/core';
import { MessageSchema, WalletCreateSchema, WalletUnlockSchema } from '@nft-wallet/shared';
import type { Message, MessageResponse, WalletState, VaultData } from '@nft-wallet/shared';
import { checkPermission, requestPermission, revokePermission, listPermissions } from './permissionManager.js';
import { checkBalanceChanges, checkNFTChanges } from './notificationHandler.js';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ethers } from 'ethers';

// Helper function to convert hex string to Uint8Array (replaces Buffer in service worker)
function hexToUint8Array(hexString: string): Uint8Array {
  // Remove '0x' prefix if present
  const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

// Helper to convert 32-byte private key to 64-byte Solana secret key
async function solanaSecretKeyFromPrivateKey(privateKeyHex: string): Promise<Uint8Array> {
  const { Keypair } = await import('@solana/web3.js');
  
  // Convert hex to bytes
  const privateKeyBytes = hexToUint8Array(privateKeyHex);
  
  console.log('Private key bytes length:', privateKeyBytes.length);
  
  // Solana uses ed25519, which needs a 64-byte secret key (32 private + 32 public)
  // If we only have 32 bytes, we need to derive the full keypair
  if (privateKeyBytes.length === 32) {
    // Create keypair from seed (32 bytes)
    const keypair = Keypair.fromSeed(privateKeyBytes);
    return keypair.secretKey; // This is 64 bytes
  } else if (privateKeyBytes.length === 64) {
    // Already have the full secret key
    return privateKeyBytes;
  } else {
    throw new Error(`Invalid private key length: ${privateKeyBytes.length}. Expected 32 or 64 bytes.`);
  }
}

// Global wallet engine instance
let walletEngine: WalletEngine | null = null;

// At the top of the file, add a pending requests map
const pendingConnectionRequests = new Map<string, Promise<any>>();

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
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.WALLET_STATE, 
      STORAGE_KEYS.VAULT_DATA, 
      'lastActivityTime', 
      'autoLockMinutes',
      'unlockedPassword' // Temporary storage for keeping vault unlocked
    ]);
    const state = result[STORAGE_KEYS.WALLET_STATE];
    
    walletEngine = new WalletEngine(state);
    
    // If wallet was unlocked, check if it should still be unlocked
    if (state?.isUnlocked && result.lastActivityTime && result.unlockedPassword) {
      const autoLockMinutes = result.autoLockMinutes || 5;
      const inactiveTime = Date.now() - result.lastActivityTime;
      const lockThreshold = autoLockMinutes * 60 * 1000;
      
      if (inactiveTime >= lockThreshold) {
        console.log('🔒 Locking wallet due to inactivity on service worker restart');
        walletEngine.lockWallet();
        await saveWalletState(walletEngine.getState());
        // Clear password
        await chrome.storage.local.remove('unlockedPassword');
      } else {
        console.log('✅ Wallet still within auto-lock window, restoring vault unlock state');
        try {
          // Re-unlock the vault with stored password
          const vaultData = result[STORAGE_KEYS.VAULT_DATA];
          if (vaultData && result.unlockedPassword) {
            await walletEngine.unlockWallet(vaultData, result.unlockedPassword);
            console.log('✅ Vault successfully restored to unlocked state');
          }
        } catch (error) {
          console.error('❌ Failed to restore vault unlock state:', error);
          walletEngine.lockWallet();
          await saveWalletState(walletEngine.getState());
          await chrome.storage.local.remove('unlockedPassword');
        }
      }
    }
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

    // Reset activity timer on any message (user interaction)
    if (engine.getState().isUnlocked) {
      engine.resetActivity();
      // Also update Chrome storage for persistent tracking
      await chrome.storage.local.set({ lastActivityTime: Date.now() });
    }

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
      
      case 'RESET_ACTIVITY': {
        engine.resetActivity();
        await chrome.storage.local.set({ lastActivityTime: Date.now() });
        return { success: true };
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
        const { password } = validatedMessage.data;
        const result = await chrome.storage.local.get([STORAGE_KEYS.VAULT_DATA]);
        const vaultData = result[STORAGE_KEYS.VAULT_DATA];

        if (!vaultData) {
          throw new Error('No wallet found');
        }

        await engine.unlockWallet(vaultData, password);
        
        // Store password temporarily (encrypted in memory) to restore vault on service worker restart
        // NOTE: This is stored in chrome.storage.local which is encrypted by Chrome
        await chrome.storage.local.set({ 
          unlockedPassword: password,
          lastActivityTime: Date.now()
        });
        
        const state = engine.getState();
        await saveWalletState(state);

        const solAccount = engine.getCurrentAccount('solana');
        const ethAccount = engine.getCurrentAccount('ethereum');

        console.log('Wallet unlocked - SOL:', solAccount?.address, 'ETH:', ethAccount?.address);

        return { 
          success: true, 
          data: { 
            address: solAccount?.address,
            ethAddress: ethAccount?.address
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
        try {
          const state = engine.getState();
          if (!state.isUnlocked) {
            throw new Error('Wallet is locked');
          }
          const mnemonic = engine.getMnemonic();
          return { success: true, data: { mnemonic } };
        } catch (error: any) {
          console.error('❌ GET_MNEMONIC error:', error.message);
          return { success: false, error: error.message };
        }
      }

      case 'GET_PRIVATE_KEY': {
        try {
          const state = engine.getState();
          if (!state.isUnlocked) {
            throw new Error('Wallet is locked');
          }
          
          const { chain } = validatedMessage.data;
          if (!chain) {
            throw new Error('Chain parameter is required');
          }
          
          const privateKey = engine.getPrivateKey(chain, 0);
          return { success: true, data: { privateKey } };
        } catch (error: any) {
          console.error('❌ GET_PRIVATE_KEY error:', error.message);
          return { success: false, error: error.message };
        }
      }

      case 'SET_AUTO_LOCK_TIME': {
        const { minutes } = validatedMessage.data;
        engine.setAutoLockTime(minutes);
        await chrome.storage.local.set({ autoLockMinutes: minutes });
        console.log(`✅ Auto-lock time set to ${minutes} minutes`);
        return { success: true, data: { minutes } };
      }

      case 'CHANGE_PASSWORD': {
        const { currentPassword, newPassword } = validatedMessage.data;
        const state = engine.getState();
        
        if (!state.isUnlocked) {
          return { success: false, error: 'Wallet is locked' };
        }

        if (!state.vaultData) {
          return { success: false, error: 'No vault data found' };
        }

        try {
          // Verify current password by trying to unlock
          const vault = engine.getVault();
          const content = await vault.unlock(state.vaultData, currentPassword);
          
          // Create new vault with same mnemonic but new password
          const newVaultData = await vault.create(newPassword, content.mnemonic);
          
          // Update state with new vault data
          await chrome.storage.local.set({ [STORAGE_KEYS.VAULT_DATA]: newVaultData });
          
          // Re-unlock with new password
          await engine.unlockWallet(newVaultData, newPassword);
          
          console.log('✅ Password changed successfully');
          return { success: true, data: { message: 'Password changed successfully' } };
        } catch (error: any) {
          console.error('❌ Password change failed:', error.message);
          return { success: false, error: 'Current password is incorrect' };
        }
      }

      case 'WALLET_LOCK': {
        engine.lockWallet();
        const state = engine.getState();
        await saveWalletState(state);
        // Clear stored password
        await chrome.storage.local.remove('unlockedPassword');
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
                console.log('Total NFTs from Helius:', solData.result.items.length);
                
                // Log compression status for each NFT
                solData.result.items.forEach((nft: any, index: number) => {
                  console.log(`NFT ${index + 1}:`, {
                    name: nft.content?.metadata?.name || nft.id.slice(0, 8),
                    interface: nft.interface,
                    compressed: nft.compression?.compressed,
                    compression: nft.compression,
                  });
                });
                
                const solNfts = solData.result.items
                  .filter((nft: any) => {
                    // Filter out compressed NFTs for now (they need special handling)
                    const isCompressed = nft.compression?.compressed === true;
                    if (isCompressed) {
                      console.log('⚠️ Filtering out compressed NFT:', nft.content?.metadata?.name || nft.id);
                    }
                    return !isCompressed;
                  })
                  .map((nft: any) => ({
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
                console.log('NFTs after filtering:', solNfts.length);
                console.log('Filtered NFTs:', solNfts.map(n => n.metadata.name));
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

      case 'SEND_NFT': {
        const { nft, toAddress } = validatedMessage.data;
        
        console.log('🚀 SEND_NFT request:', { nft, toAddress });
        
        if (!engine.getState().isUnlocked) {
          throw new Error('Wallet is locked');
        }

        // Determine chain from NFT data
        const chain = nft?.chain || (nft?.mint ? 'solana' : 'ethereum');
        
        try {
            //nft code 21

            if (chain === 'solana') {
            // Send Solana NFT
            const solAccount = engine.getCurrentAccount('solana');
            if (!solAccount) {
              throw new Error('No Solana account found');
            }

            // Get private key for signing
            const privateKeyStr = engine.getPrivateKey('solana', 0);
            console.log('Private key string length:', privateKeyStr.length);
            
            // Convert to proper Solana secret key (64 bytes)
            const secretKey = await solanaSecretKeyFromPrivateKey(privateKeyStr);
            console.log('Secret key bytes length:', secretKey.length);
            
            const fromKeypair = Keypair.fromSecretKey(secretKey);
            console.log('Keypair created:', fromKeypair.publicKey.toString());
            
            // Connect to Solana
            const HELIUS_API_KEY = '647bbd34-42b3-418b-bf6c-c3a40813b41c';
            const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, 'confirmed');
            
            // Get mint/asset address
            const assetAddress = new PublicKey(nft.mint || nft.id);
            const toPublicKey = new PublicKey(toAddress);
            
            const nftInterface = nft.raw?.interface || nft.interface || '';
            
            console.log('📤 Sending Solana NFT:', {
              asset: assetAddress.toString(),
              interface: nftInterface,
              from: solAccount.address,
              to: toAddress
            });
            
            // Check if this is a compressed NFT
            if (nft.compression?.compressed || nft.raw?.compression?.compressed) {
              throw new Error(
                'Compressed NFTs (cNFTs) are not yet supported. ' +
                'These use Metaplex Bubblegum and require special transfer logic.'
              );
            }
            
            //send metacore
                        // Handle Metaplex Core Assets
            if (nftInterface === 'MplCoreAsset' || nftInterface.includes('MplCore')) {
              console.log('📦 Metaplex Core Asset - using MPL Core transfer');
              console.log('Full NFT data:', JSON.stringify(nft, null, 2));
              
              try {
                // Dynamic import for Metaplex Core
                const { createUmi } = await import('@metaplex-foundation/umi-bundle-defaults');
                const { createSignerFromKeypair, signerIdentity, publicKey: umiPublicKey, some, none } = await import('@metaplex-foundation/umi');
                const { transferV1, fetchAssetV1 } = await import('@metaplex-foundation/mpl-core');
                
                // Create Umi instance
                const umi = createUmi(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`);
                
                // Create Umi keypair from secret key
                const umiKeypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
                const signer = createSignerFromKeypair(umi, umiKeypair);
                umi.use(signerIdentity(signer));
                
                console.log('Umi signer:', signer.publicKey);
                
                // Get collection from Helius data - it's in the grouping array
                let collectionPubkey = null;
                
                // Method 1: Check grouping from raw data
                const grouping = nft.raw?.grouping || nft.grouping;
                console.log('Grouping data:', grouping);
                
                if (grouping && Array.isArray(grouping)) {
                  const collectionGroup = grouping.find((g: any) => g.group_key === 'collection');
                  if (collectionGroup && collectionGroup.group_value) {
                    console.log('Found collection in grouping:', collectionGroup.group_value);
                    collectionPubkey = umiPublicKey(collectionGroup.group_value);
                  }
                }
                
                // Method 2: Fetch asset on-chain and check
                if (!collectionPubkey) {
                  console.log('Fetching asset on-chain to find collection...');
                  const asset = await fetchAssetV1(umi, umiPublicKey(assetAddress.toString()));
                  console.log('Asset data:', asset);
                  
                  // Check updateAuthority structure for collection
                  if (asset.updateAuthority) {
                    console.log('UpdateAuthority:', asset.updateAuthority);
                    
                    // Metaplex Core v1 structure
                    if (typeof asset.updateAuthority === 'object' && 'type' in asset.updateAuthority) {
                      if (asset.updateAuthority.type === 'Collection') {
                        collectionPubkey = asset.updateAuthority.address;
                        console.log('Found collection from updateAuthority.address:', collectionPubkey);
                      }
                    }
                  }
                }
                
                console.log('Final collection pubkey:', collectionPubkey);
                
                if (!collectionPubkey) {
                  throw new Error(
                    'Could not determine collection address for this NFT. ' +
                    'This Metaplex Core Asset requires a collection to transfer. ' +
                    'Please check the console logs and report this issue.'
                  );
                }
                
                // Build transfer instruction with collection
                console.log('Building transfer with collection...');
                const tx = await transferV1(umi, {
                  asset: umiPublicKey(assetAddress.toString()),
                  newOwner: umiPublicKey(toAddress),
                  collection: some(collectionPubkey),
                }).sendAndConfirm(umi);
                
                // Convert signature to base58
                const bs58 = await import('bs58');
                const signature = bs58.default.encode(tx.signature);
                
                console.log('✅ Metaplex Core NFT sent! Signature:', signature);
                
                return {
                  success: true,
                  data: {
                    txHash: signature,
                    explorerUrl: `https://solscan.io/tx/${signature}`
                  }
                };
              } catch (error: any) {
                console.error('❌ Metaplex Core transfer error:', error);
                console.error('Error stack:', error.stack);
                console.error('Error logs:', error.logs);
                throw new Error(`Failed to transfer Metaplex Core Asset: ${error.message}`);
              }
            }
            
            // send SPL Token NFTs
            console.log('📦 Regular SPL Token NFT');
            
            // Detect which token program this NFT uses
            const mintInfo = await connection.getAccountInfo(assetAddress);
            if (!mintInfo) {
              throw new Error('Could not find NFT mint account.');
            }
            
            // Token-2022 uses a different program ID
            const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
            
            // Check which program owns this mint
            const isToken2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
            const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
            
            console.log('Token Program:', isToken2022 ? 'Token-2022' : 'Legacy Token Program');
            
            // Get associated token accounts
            const fromATA = await getAssociatedTokenAddress(
              assetAddress,
              fromKeypair.publicKey,
              false,
              tokenProgramId
            );
            
            const toATA = await getAssociatedTokenAddress(
              assetAddress,
              toPublicKey,
              false,
              tokenProgramId
            );
            
            console.log('From ATA:', fromATA.toString());
            console.log('To ATA:', toATA.toString());
            
            // Check if source account has the NFT
            const fromTokenAccount = await connection.getAccountInfo(fromATA);
            if (!fromTokenAccount) {
              throw new Error('You do not own this NFT in your token account.');
            }
            
            console.log('✅ Found source token account');
            
            // Check if destination token account exists
            const toAccountInfo = await connection.getAccountInfo(toATA);
            console.log('Destination account exists:', !!toAccountInfo);
            
            const transaction = new Transaction();
            
            // If destination account doesn't exist, create it
            if (!toAccountInfo) {
              console.log('Creating destination token account...');
              transaction.add(
                createAssociatedTokenAccountInstruction(
                  fromKeypair.publicKey,
                  toATA,
                  toPublicKey,
                  assetAddress,
                  tokenProgramId
                )
              );
            }
            
            // Add transfer instruction
            console.log('Adding transfer instruction...');
            transaction.add(
              createTransferInstruction(
                fromATA,
                toATA,
                fromKeypair.publicKey,
                1, // NFT amount is always 1
                [],
                tokenProgramId
              )
            );
            
            // Get recent blockhash
            console.log('Getting recent blockhash...');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = fromKeypair.publicKey;
            
            // Sign and send transaction
            console.log('Signing transaction...');
            transaction.sign(fromKeypair);
            
            console.log('Sending transaction...');
            const signature = await connection.sendRawTransaction(
              transaction.serialize(),
              {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
                maxRetries: 3
              }
            );
            
            console.log('✅ SPL Token NFT sent! Signature:', signature);
            
            // Wait for confirmation
            console.log('Waiting for confirmation...');
            const confirmation = await connection.confirmTransaction(
              {
                signature,
                blockhash,
                lastValidBlockHeight
              },
              'confirmed'
            );
            
            if (confirmation.value.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            }
            
            console.log('✅ Transaction confirmed!');
            
            return { 
              success: true, 
              data: { 
                txHash: signature,
                explorerUrl: `https://solscan.io/tx/${signature}`
              } 
            };
          
            //end new
          } else {
            // Send Ethereum NFT
            const ethAccount = engine.getCurrentAccount('ethereum');
            if (!ethAccount) {
              throw new Error('No Ethereum account found');
            }

            // Get private key for signing (already has 0x prefix for ethers)
            const privateKey = engine.getPrivateKey('ethereum', 0);
            
            // Connect to Ethereum
            const ALCHEMY_API_KEY = 'WD0X0NprnF2uHt6pb_dWC';
            const provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
            const wallet = new ethers.Wallet(privateKey, provider);
            
            console.log('📤 Sending Ethereum NFT:', {
              contract: nft.contract?.address,
              tokenId: nft.tokenId,
              from: ethAccount.address,
              to: toAddress
            });
            
            // Determine if ERC721 or ERC1155
            const isERC1155 = nft.contract?.tokenType?.includes('1155') || nft.balance > 1;
            
            if (isERC1155) {
              // ERC1155 transfer
              const abi = [
                'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)'
              ];
              const contract = new ethers.Contract(nft.contract.address, abi, wallet);
              
              console.log('Sending ERC1155 NFT...');
              const tx = await contract.safeTransferFrom(
                ethAccount.address,
                toAddress,
                nft.tokenId,
                1, // Amount
                '0x' // Data
              );
              
              console.log('✅ Ethereum ERC1155 sent! Hash:', tx.hash);
              console.log('Waiting for confirmation...');
              await tx.wait();
              
              return { 
                success: true, 
                data: { 
                  txHash: tx.hash,
                  explorerUrl: `https://etherscan.io/tx/${tx.hash}`
                } 
              };
              
            } else {
              // ERC721 transfer
              const abi = [
                'function safeTransferFrom(address from, address to, uint256 tokenId)'
              ];
              const contract = new ethers.Contract(nft.contract.address, abi, wallet);
              
              console.log('Sending ERC721 NFT...');
              const tx = await contract.safeTransferFrom(
                ethAccount.address,
                toAddress,
                nft.tokenId
              );
              
              console.log('✅ Ethereum ERC721 sent! Hash:', tx.hash);
              console.log('Waiting for confirmation...');
              await tx.wait();
              
              return { 
                success: true, 
                data: { 
                  txHash: tx.hash,
                  explorerUrl: `https://etherscan.io/tx/${tx.hash}`
                } 
              };
            }
          }
        } catch (error: any) {
          console.error('❌ SEND_NFT error:', error);
          console.error('Error stack:', error.stack);
          return { 
            success: false, 
            error: error.message || 'Failed to send NFT' 
          };
        }
      }
      
      case 'SEND_TRANSACTION': {
        const { chain, to, amount, tokenAddress } = validatedMessage.data;
        
        console.log('💸 SEND_TRANSACTION request:', { chain, to, amount, tokenAddress });
        
        if (!engine.getState().isUnlocked) {
          throw new Error('Wallet is locked');
        }

        try {
          if (chain === 'solana') {
            // Dynamic import for Solana
            const { Connection, PublicKey, Transaction, SystemProgram, Keypair } = await import('@solana/web3.js');
            const { createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = await import('@solana/spl-token');
            
            // Send SOL or SPL tokens
            const solAccount = engine.getCurrentAccount('solana');
            if (!solAccount) {
              throw new Error('No Solana account found');
            }

            const privateKeyStr = engine.getPrivateKey('solana', 0);
            const secretKey = await solanaSecretKeyFromPrivateKey(privateKeyStr);
            const fromKeypair = Keypair.fromSecretKey(privateKey);
            
            const HELIUS_API_KEY = '647bbd34-42b3-418b-bf6c-c3a40813b41c';
            const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, 'confirmed');
            
            const toPublicKey = new PublicKey(to);
            
            if (!tokenAddress) {
              // Send native SOL
              const lamports = Math.floor(parseFloat(amount) * 1e9); // Convert SOL to lamports
              
              const transaction = new Transaction().add(
                SystemProgram.transfer({
                  fromPubkey: fromKeypair.publicKey,
                  toPubkey: toPublicKey,
                  lamports,
                })
              );
              
              const { blockhash } = await connection.getLatestBlockhash();
              transaction.recentBlockhash = blockhash;
              transaction.feePayer = fromKeypair.publicKey;
              
              transaction.sign(fromKeypair);
              const signature = await connection.sendRawTransaction(transaction.serialize());
              
              console.log('✅ SOL sent! Signature:', signature);
              await connection.confirmTransaction(signature, 'confirmed');
              
              return { 
                success: true, 
                data: { 
                  txHash: signature,
                  explorerUrl: `https://solscan.io/tx/${signature}`
                } 
              };
            } else {
              // Send SPL token
              const mintAddress = new PublicKey(tokenAddress);
              const tokenAmount = Math.floor(parseFloat(amount) * 1e9); // Assuming 9 decimals
              
              const fromATA = await getAssociatedTokenAddress(mintAddress, fromKeypair.publicKey);
              const toATA = await getAssociatedTokenAddress(mintAddress, toPublicKey);
              
              const transaction = new Transaction();
              
              // Check if destination account exists
              const toAccountInfo = await connection.getAccountInfo(toATA);
              if (!toAccountInfo) {
                transaction.add(
                  createAssociatedTokenAccountInstruction(
                    fromKeypair.publicKey,
                    toATA,
                    toPublicKey,
                    mintAddress
                  )
                );
              }
              
              transaction.add(
                createTransferInstruction(
                  fromATA,
                  toATA,
                  fromKeypair.publicKey,
                  tokenAmount
                )
              );
              
              const { blockhash } = await connection.getLatestBlockhash();
              transaction.recentBlockhash = blockhash;
              transaction.feePayer = fromKeypair.publicKey;
              
              transaction.sign(fromKeypair);
              const signature = await connection.sendRawTransaction(transaction.serialize());
              
              console.log('✅ SPL token sent! Signature:', signature);
              await connection.confirmTransaction(signature, 'confirmed');
              
              return { 
                success: true, 
                data: { 
                  txHash: signature,
                  explorerUrl: `https://solscan.io/tx/${signature}`
                } 
              };
            }
            
          } else {
            // Dynamic import for Ethereum
            const { ethers } = await import('ethers');
            
            // Send ETH or ERC20 tokens
            const ethAccount = engine.getCurrentAccount('ethereum');
            if (!ethAccount) {
              throw new Error('No Ethereum account found');
            }

            const privateKey = engine.getPrivateKey('ethereum', 0);
            const ALCHEMY_API_KEY = 'WD0X0NprnF2uHt6pb_dWC';
            const provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
            const wallet = new ethers.Wallet(privateKey, provider);
            
            if (!tokenAddress) {
              // Send native ETH
              const tx = await wallet.sendTransaction({
                to,
                value: ethers.parseEther(amount)
              });
              
              console.log('✅ ETH sent! Hash:', tx.hash);
              await tx.wait();
              
              return { 
                success: true, 
                data: { 
                  txHash: tx.hash,
                  explorerUrl: `https://etherscan.io/tx/${tx.hash}`
                } 
              };
            } else {
              // Send ERC20 token
              const abi = [
                'function transfer(address to, uint256 amount) returns (bool)'
              ];
              const contract = new ethers.Contract(tokenAddress, abi, wallet);
              
              const tx = await contract.transfer(to, ethers.parseUnits(amount, 18));
              
              console.log('✅ ERC20 sent! Hash:', tx.hash);
              await tx.wait();
              
              return { 
                success: true, 
                data: { 
                  txHash: tx.hash,
                  explorerUrl: `https://etherscan.io/tx/${tx.hash}`
                } 
              };
            }
          }
        } catch (error: any) {
          console.error('❌ SEND_TRANSACTION error:', error);
          return { 
            success: false, 
            error: error.message || 'Failed to send transaction' 
          };
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

      // Then update the PERMISSION_REQUEST case:
      case 'PERMISSION_REQUEST': {
        console.log('🟢 Background: PERMISSION_REQUEST received', validatedMessage.data);
        const origin = sender.origin || sender.url || 'unknown';
        const state = engine.getState();
        
        console.log('🟢 Background: Wallet unlocked?', state.isUnlocked);
        
        if (!state.isUnlocked) {
          throw new Error('Wallet is locked. Please unlock your wallet first.');
        }
        
        const { chain, requestedPermissions } = validatedMessage.data;
        const account = engine.getCurrentAccount(chain);
        
        console.log('🟢 Background: Account for', chain, ':', account);
        
        if (!account) {
          throw new Error(`No ${chain} account found`);
        }
        
        // Check if permission already granted
        const hasPermission = await checkPermission(origin, chain);
        if (hasPermission) {
          console.log('🟢 Background: Permission already granted for', origin, chain);
          return { 
            success: true, 
            data: {
              address: account.address,
              publicKey: account.address
            }
          };
        }
        
        // Check if there's already a pending request for this origin+chain
        const requestKey = `${origin}_${chain}`;
        if (pendingConnectionRequests.has(requestKey)) {
          console.log('🟢 Background: Reusing pending approval for', requestKey);
          return pendingConnectionRequests.get(requestKey)!;
        }
        
        // Show approval popup
        console.log('🟢 Background: Showing approval popup for origin:', origin, 'chain:', chain);
        
        const approvalPromise = new Promise((resolve, reject) => {
          // Store the pending request
          const requestId = `connect_${Date.now()}_${chain}`;
          chrome.storage.local.set({
            [requestId]: {
              type: 'connect',
              origin,
              chain,
              address: account.address,
              timestamp: Date.now()
            }
          });
          
          chrome.windows.create({
            url: chrome.runtime.getURL(`index.html#connect?requestId=${requestId}`),
            type: 'popup',
            width: 360,
            height: 600,
          }, (window) => {
            if (!window) {
              pendingConnectionRequests.delete(requestKey);
              reject(new Error('Failed to create popup'));
              return;
            }
            
            console.log('🟢 Popup created with ID:', window.id);
            
            // Poll for approval result
            const checkApproval = setInterval(async () => {
              const result = await chrome.storage.local.get([`${requestId}_result`]);
              const approval = result[`${requestId}_result`];
              
              if (approval) {
                clearInterval(checkApproval);
                clearInterval(checkWindow);
                pendingConnectionRequests.delete(requestKey);
                
                // Clean up
                await chrome.storage.local.remove([requestId, `${requestId}_result`]);
                
                if (approval.approved) {
                  console.log('🟢 User approved connection for', chain);
                  
                  // Grant permission
                  await requestPermission({ 
                    ...validatedMessage.data, 
                    origin,
                    requestedAccounts: [account.address]
                  });
                  
                  resolve({ 
                    success: true, 
                    data: {
                      address: account.address,
                      publicKey: account.address
                    }
                  });
                } else {
                  console.log('🔴 User rejected connection for', chain);
                  reject(new Error('User rejected the request'));
                }
              }
            }, 100);
            
            // Check if window is closed
            const checkWindow = setInterval(() => {
              chrome.windows.get(window.id!, (w) => {
                if (chrome.runtime.lastError || !w) {
                  clearInterval(checkWindow);
                  clearInterval(checkApproval);
                  pendingConnectionRequests.delete(requestKey);
                  chrome.storage.local.remove([requestId, `${requestId}_result`]);
                  reject(new Error('User closed the popup'));
                }
              });
            }, 500);
            
            // Timeout after 2 minutes
            setTimeout(() => {
              clearInterval(checkApproval);
              clearInterval(checkWindow);
              chrome.windows.remove(window.id!).catch(() => {});
              pendingConnectionRequests.delete(requestKey);
              chrome.storage.local.remove([requestId, `${requestId}_result`]);
              reject(new Error('Request timeout'));
            }, 120000);
          });
        });
        
        // Store the pending promise
        pendingConnectionRequests.set(requestKey, approvalPromise);
        
        return approvalPromise;
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
        
        console.log('🔏 SIGN_MESSAGE received:', { msg: msg.substring(0, 50), chain, address });
        
        // Show approval popup for signing
        const origin = sender.origin || sender.url || 'unknown';
        
        console.log('🔏 Creating approval popup for origin:', origin);
        
        return new Promise((resolve) => {
          chrome.windows.create({
            url: `approval.html?type=sign&message=${encodeURIComponent(msg)}&chain=${chain}&origin=${encodeURIComponent(origin)}`,
            type: 'popup',
            width: 400,
            height: 600,
          }, (window) => {
            console.log('🔏 Approval popup created:', window?.id);
            
            // Listen for approval response
            const listener = (message: any, messageSender: any, sendResponse: any) => {
              console.log('🔏 Received message in listener:', message.type);
              
              if (message.type === 'SIGN_APPROVED') {
                chrome.runtime.onMessage.removeListener(listener);
                
                console.log('🔏 User approved, signing message...');
                
                // Sign the message
                engine.signMessage(msg, chain, address)
                  .then(signature => {
                    console.log('🔏 Message signed successfully');
                    resolve({ success: true, data: signature });
                    if (window?.id) chrome.windows.remove(window.id);
                  })
                  .catch(error => {
                    console.error('🔏 Signing error:', error);
                    resolve({ success: false, error: error.message });
                    if (window?.id) chrome.windows.remove(window.id);
                  });
              } else if (message.type === 'SIGN_REJECTED') {
                chrome.runtime.onMessage.removeListener(listener);
                console.log('🔏 User rejected signature');
                resolve({ success: false, error: 'User rejected signature' });
                if (window?.id) chrome.windows.remove(window.id);
              }
            };
            
            chrome.runtime.onMessage.addListener(listener);
          });
        });
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
