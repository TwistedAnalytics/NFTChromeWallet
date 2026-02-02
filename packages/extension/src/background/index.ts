import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
import { handleMessage } from './messageHandler.js';
import { checkForIncomingAssets } from './notificationHandler.js';

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
  
  // Start monitoring immediately
  chrome.alarms.create('monitorAssets', {
    periodInMinutes: 0.5, // Check every 30 seconds
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type);

  try {
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
      // Silent fail
    }
  }

  return true;
});

// Start monitoring on extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started, starting asset monitoring...');
  chrome.alarms.create('monitorAssets', {
    periodInMinutes: 0.5,
  });
});

// Set up auto-lock alarm
chrome.alarms.create('autoLock', {
  periodInMinutes: 1,
});

// Keep service worker alive
chrome.alarms.create('keepAlive', { 
  periodInMinutes: 1 
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    if (alarm.name === 'monitorAssets') {
      // Check for incoming assets (works even when locked)
      await checkForIncomingAssets();
    }
    
    if (alarm.name === 'autoLock') {
      // Auto-lock check
      const result = await chrome.storage.local.get(['lastActivityTime', 'autoLockMinutes', 'autoLockEnabled', 'walletState']);
      
      const autoLockEnabled = result.autoLockEnabled !== false;
      
      if (autoLockEnabled && result.walletState?.isUnlocked && result.lastActivityTime) {
        const autoLockMinutes = result.autoLockMinutes || 5;
        const inactiveTime = Date.now() - result.lastActivityTime;
        const lockThreshold = autoLockMinutes * 60 * 1000;
        
        if (inactiveTime >= lockThreshold) {
          console.log('🔒 Auto-locking wallet due to inactivity');
          
          const state = result.walletState;
          state.isUnlocked = false;
          await chrome.storage.local.set({ walletState: state });
          
          console.log('✅ Wallet locked');
        }
      }
    }
    
    if (alarm.name === 'keepAlive') {
      console.log('⏰ Keep alive ping');
    }
  } catch (error) {
    console.error('Alarm error:', error);
  }
});

console.log('✅ VaultNFT background service worker ready');
