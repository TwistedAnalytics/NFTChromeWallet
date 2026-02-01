import { handleMessage } from './messageHandler.js';
import { startBalanceMonitoring } from './notificationHandler.js';

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

  // Handle message asynchronously
  handleMessage(message, sender)
    .then(response => {
      sendResponse(response);
    })
    .catch(error => {
      console.error('Error handling message:', error);
      sendResponse({
        success: false,
        error: error.message || 'Unknown error',
      });
    });

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
        handleMessage({ type: 'WALLET_LOCK', data: {} }, {})
          .then(() => console.log('✅ Wallet auto-locked'))
          .catch(err => console.error('❌ Auto-lock failed:', err));
      }
    }
  }
  
  if (alarm.name === 'keepAlive') {
    console.log('Service worker kept alive');
  }
});

console.log('VaultNFT background service worker ready');
