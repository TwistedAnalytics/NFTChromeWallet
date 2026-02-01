import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
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
