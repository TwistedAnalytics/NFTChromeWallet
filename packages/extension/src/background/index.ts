import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
import { handleMessage } from './messageHandler.js';
import { startBalanceMonitoring } from './notificationHandler.js';

// Add at the top with other imports
let lastKnownBalances: { sol: string; eth: string } = { sol: '0', eth: '0' };
let lastKnownNFTCount = 0;

console.log('VaultNFT background service worker starting...');

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('VaultNFT installed');
  
  // Set default auto-lock settings
  const result = await chrome.storage.local.get(['autoLockEnabled', 'autoLockMinutes']);
  if (result.autoLockEnabled === undefined) {
    await chrome.storage.local.set({ 
      autoLockEnabled: true,
      autoLockMinutes: 5,
      lastActivityTime: Date.now()
    });
    console.log('Auto-lock defaults set: enabled=true, minutes=5');
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type);

  // Wrap everything in try-catch to prevent ANY errors from bubbling up
  try {
    // Handle message asynchronously
    handleMessage(message, sender)
      .then(response => {
        try {
          sendResponse(response);
        } catch (error) {
          console.error('❌ Error sending response:', error);
        }
      })
      .catch(error => {
        console.error('❌ Message handler error:', error?.message || error);
        try {
          sendResponse({
            success: false,
            error: error?.message || 'An unexpected error occurred',
          });
        } catch (sendError) {
          console.error('❌ Could not send error response:', sendError);
        }
      });
  } catch (error) {
    console.error('❌ Critical error in message listener:', error);
    try {
      sendResponse({
        success: false,
        error: 'Critical error occurred',
      });
    } catch (e) {
      // Silent fail - don't let anything bubble up
    }
  }

  // Return true to indicate we'll send response asynchronously
  return true;
});

// Start balance monitoring when extension loads
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started, initializing balance monitoring...');
});

// Set up auto-lock alarm - check every minute
chrome.alarms.create('autoLock', {
  periodInMinutes: 1,
});

// Keep service worker alive
chrome.alarms.create('keepAlive', { 
  periodInMinutes: 1 
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    if (alarm.name === 'autoLock') {
      // Check if wallet should be locked due to inactivity
      const result = await chrome.storage.local.get(['lastActivityTime', 'autoLockMinutes', 'autoLockEnabled', 'walletState']);
      
      console.log('Auto-lock check:', {
        enabled: result.autoLockEnabled,
        unlocked: result.walletState?.isUnlocked,
        lastActivity: result.lastActivityTime ? new Date(result.lastActivityTime).toLocaleTimeString() : 'never',
        autoLockMinutes: result.autoLockMinutes
      });
      
      // Default to enabled if not set
      const autoLockEnabled = result.autoLockEnabled !== false;
      
      if (autoLockEnabled && result.walletState?.isUnlocked && result.lastActivityTime) {
        const autoLockMinutes = result.autoLockMinutes || 5;
        const inactiveTime = Date.now() - result.lastActivityTime;
        const lockThreshold = autoLockMinutes * 60 * 1000;
        
        console.log(`Inactive for ${Math.floor(inactiveTime / 1000 / 60)} minutes (threshold: ${autoLockMinutes} minutes)`);
        
        if (inactiveTime >= lockThreshold) {
          console.log(`🔒 Auto-locking wallet after ${autoLockMinutes} minutes of inactivity`);
          
          // Send lock message
          try {
            await handleMessage({ type: 'WALLET_LOCK', data: {} }, {});
            console.log('✅ Wallet auto-locked');
          } catch (err) {
            console.error('❌ Auto-lock failed:', err);
          }
        }
      }
    }
    
    if (alarm.name === 'keepAlive') {
      console.log('Service worker kept alive');
    }
  } catch (error) {
    console.error('❌ Error in alarm listener:', error);
    // Don't throw - just log
  }
});

// Global error handler to catch any unhandled errors
self.addEventListener('error', (event) => {
  console.error('❌ Unhandled error in service worker:', event.error);
  event.preventDefault(); // Prevent error from showing in Chrome
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent error from showing in Chrome
});

console.log('VaultNFT background service worker ready');

// Function to show notification
async function showNotification(title: string, message: string, iconUrl?: string) {
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: iconUrl || '/icons/icon128.png',
    title: title,
    message: message,
    priority: 2
  });
}

// Function to check for balance changes
async function checkBalanceChanges() {
  try {
    const state = engine.getState();
    if (!state.isUnlocked) return;

    // Get current balances
    const solAccount = engine.getCurrentAccount('solana');
    const ethAccount = engine.getCurrentAccount('ethereum');

    if (!solAccount || !ethAccount) return;

    const HELIUS_API_KEY = '647bbd34-42b3-418b-bf6c-c3a40813b41c';
    const ALCHEMY_API_KEY = 'WD0X0NprnF2uHt6pb_dWC';

    // Check Solana balance
    const solConnection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`);
    const solBalance = await solConnection.getBalance(new PublicKey(solAccount.address));
    const solBalanceFormatted = (solBalance / 1e9).toFixed(4);

    // Check Ethereum balance
    const ethProvider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
    const ethBalance = await ethProvider.getBalance(ethAccount.address);
    const ethBalanceFormatted = parseFloat(ethers.formatEther(ethBalance)).toFixed(4);

    // Compare with last known balances
    if (parseFloat(solBalanceFormatted) > parseFloat(lastKnownBalances.sol)) {
      const diff = (parseFloat(solBalanceFormatted) - parseFloat(lastKnownBalances.sol)).toFixed(4);
      await showNotification(
        '💰 SOL Received!',
        `+${diff} SOL received\nNew balance: ${solBalanceFormatted} SOL`
      );
    }

    if (parseFloat(ethBalanceFormatted) > parseFloat(lastKnownBalances.eth)) {
      const diff = (parseFloat(ethBalanceFormatted) - parseFloat(lastKnownBalances.eth)).toFixed(4);
      await showNotification(
        '💰 ETH Received!',
        `+${diff} ETH received\nNew balance: ${ethBalanceFormatted} ETH`
      );
    }

    // Update last known balances
    lastKnownBalances = {
      sol: solBalanceFormatted,
      eth: ethBalanceFormatted
    };

  } catch (error) {
    console.error('Error checking balance changes:', error);
  }
}

// Function to check for new NFTs
async function checkNFTChanges() {
  try {
    const state = engine.getState();
    if (!state.isUnlocked) return;

    const solAccount = engine.getCurrentAccount('solana');
    const ethAccount = engine.getCurrentAccount('ethereum');

    if (!solAccount || !ethAccount) return;

    const HELIUS_API_KEY = '647bbd34-42b3-418b-bf6c-c3a40813b41c';

    // Get Solana NFTs
    const solResponse = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'nft-check',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: solAccount.address,
          page: 1,
          limit: 1000
        }
      })
    });

    const solData = await solResponse.json();
    const currentNFTCount = solData.result?.items?.length || 0;

    // Check if NFT count increased
    if (currentNFTCount > lastKnownNFTCount && lastKnownNFTCount > 0) {
      const newNFTs = currentNFTCount - lastKnownNFTCount;
      await showNotification(
        '🎨 New NFT Received!',
        `You received ${newNFTs} new NFT${newNFTs > 1 ? 's' : ''}!`
      );
    }

    lastKnownNFTCount = currentNFTCount;

  } catch (error) {
    console.error('Error checking NFT changes:', error);
  }
}

// Initialize monitoring when wallet is unlocked
let monitoringInterval: NodeJS.Timeout | null = null;

function startMonitoring() {
  if (monitoringInterval) return;

  console.log('🔔 Starting balance and NFT monitoring...');

  // Check immediately to set baseline
  checkBalanceChanges();
  checkNFTChanges();

  // Then check every 30 seconds
  monitoringInterval = setInterval(() => {
    checkBalanceChanges();
    checkNFTChanges();
  }, 30000); // 30 seconds
}

function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('🔕 Stopped monitoring');
  }
}
