import { handleMessage } from './messageHandler.js';
import { startBalanceMonitoring } from './notificationHandler.js';

console.log('VaultNFT background service worker starting...');

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('VaultNFT installed');
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    });
  return true;
});

// Start balance monitoring when extension loads
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started, initializing balance monitoring...');
});

// Keep service worker alive
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    console.log('Service worker kept alive');
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

// Set up auto-lock alarm
chrome.alarms.create('autoLock', {
  periodInMinutes: 1,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoLock') {
    // Check if wallet should be locked
    // This will be handled by the wallet engine's internal timer
  }
});

console.log('VaultNFT background service worker ready');
