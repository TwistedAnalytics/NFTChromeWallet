import { Connection, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';

interface BalanceCache {
  solBalance: string;
  ethBalance: string;
  lastChecked: number;
}

interface NFTCache {
  nftCount: number;
  lastChecked: number;
}

const CACHE_KEYS = {
  BALANCE_CACHE: 'balanceCache',
  NFT_COUNT_CACHE: 'nftCountCache',
};

/**
 * Check for incoming assets (works even when locked)
 */
export async function checkForIncomingAssets(): Promise<void> {
  try {
    // Get wallet addresses from storage (available even when locked)
    const result = await chrome.storage.local.get(['vaultData']);
    if (!result.vaultData) {
      return; // No wallet created yet
    }

    // Get the last known addresses
    const addressResult = await chrome.storage.local.get(['lastSolAddress', 'lastEthAddress']);
    if (!addressResult.lastSolAddress || !addressResult.lastEthAddress) {
      return; // Addresses not yet stored
    }

    const solAddress = addressResult.lastSolAddress;
    const ethAddress = addressResult.lastEthAddress;

    // Check balances
    await checkBalances(solAddress, ethAddress);
    
    // Check NFTs
    await checkNFTs(solAddress);
    
  } catch (error) {
    console.error('Error checking for incoming assets:', error);
  }
}

/**
 * Check balances and notify if increased
 */
async function checkBalances(solAddress: string, ethAddress: string): Promise<void> {
  try {
    const HELIUS_API_KEY = '647bbd34-42b3-418b-bf6c-c3a40813b41c';
    const ALCHEMY_API_KEY = 'WD0X0NprnF2uHt6pb_dWC';

    // Get SOL balance
    const solConnection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`);
    const solBalance = await solConnection.getBalance(new PublicKey(solAddress));
    const solBalanceFormatted = (solBalance / 1e9).toFixed(9);

    // Get ETH balance
    const ethProvider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
    const ethBalance = await ethProvider.getBalance(ethAddress);
    const ethBalanceFormatted = parseFloat(ethers.formatEther(ethBalance)).toFixed(9);

    // Check against cached values
    const result = await chrome.storage.local.get([CACHE_KEYS.BALANCE_CACHE]);
    const cached: BalanceCache | undefined = result[CACHE_KEYS.BALANCE_CACHE];

    if (cached) {
      const solChanged = parseFloat(solBalanceFormatted) > parseFloat(cached.solBalance);
      const ethChanged = parseFloat(ethBalanceFormatted) > parseFloat(cached.ethBalance);

      if (solChanged) {
        const amount = (parseFloat(solBalanceFormatted) - parseFloat(cached.solBalance)).toFixed(4);
        await showNotification(
          '💰 SOL Received!',
          `+${amount} SOL\nNew balance: ${parseFloat(solBalanceFormatted).toFixed(4)} SOL`
        );
      }

      if (ethChanged) {
        const amount = (parseFloat(ethBalanceFormatted) - parseFloat(cached.ethBalance)).toFixed(4);
        await showNotification(
          '💰 ETH Received!',
          `+${amount} ETH\nNew balance: ${parseFloat(ethBalanceFormatted).toFixed(4)} ETH`
        );
      }
    }

    // Update cache
    await chrome.storage.local.set({
      [CACHE_KEYS.BALANCE_CACHE]: {
        solBalance: solBalanceFormatted,
        ethBalance: ethBalanceFormatted,
        lastChecked: Date.now(),
      } as BalanceCache,
    });

  } catch (error) {
    console.error('Error checking balances:', error);
  }
}

/**
 * Check for new NFTs
 */
async function checkNFTs(solAddress: string): Promise<void> {
  try {
    const HELIUS_API_KEY = '647bbd34-42b3-418b-bf6c-c3a40813b41c';

    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'nft-check',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: solAddress,
          page: 1,
          limit: 1000
        }
      })
    });

    const data = await response.json();
    const nftCount = data.result?.items?.length || 0;

    // Check against cached count
    const result = await chrome.storage.local.get([CACHE_KEYS.NFT_COUNT_CACHE]);
    const cached: NFTCache | undefined = result[CACHE_KEYS.NFT_COUNT_CACHE];

    if (cached && nftCount > cached.nftCount) {
      const newNFTs = nftCount - cached.nftCount;
      await showNotification(
        '🎨 New NFT Received!',
        `You received ${newNFTs} new NFT${newNFTs > 1 ? 's' : ''}!`
      );
    }

    // Update cache
    await chrome.storage.local.set({
      [CACHE_KEYS.NFT_COUNT_CACHE]: {
        nftCount,
        lastChecked: Date.now(),
      } as NFTCache,
    });

  } catch (error) {
    console.error('Error checking NFTs:', error);
  }
}

/**
 * Show Chrome notification
 */
async function showNotification(title: string, message: string): Promise<void> {
  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title,
      message,
      priority: 2,
    });
    console.log('📬 Notification shown:', title);
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

// Export the old functions for compatibility
export async function checkBalanceChanges(
  solBalance: string,
  ethBalance: string,
  solAddress: string,
  ethAddress: string
): Promise<void> {
  // This is now handled by checkForIncomingAssets
  // Keep for backward compatibility
}

export async function checkNFTChanges(nftCount: number): Promise<void> {
  // This is now handled by checkForIncomingAssets
  // Keep for backward compatibility
}
