// Content script - runs in isolated world
console.log('VaultNFT content script loaded');

// Inject the provider script into the page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.type = 'module';
(document.head || document.documentElement).appendChild(script);

// Remove script tag after injection
script.onload = () => {
  script.remove();
};

// Set up message relay between page and background
window.addEventListener('message', async (event) => {
  // Only accept messages from same window
  if (event.source !== window) return;

  const message = event.data;

  // Check if this is a wallet message
  if (message && message.target === 'vaultNFT-background') {
    try {
      // Forward to background script
      const response = await chrome.runtime.sendMessage({
        type: message.type,
        data: message.data,
        requestId: message.requestId,
      });

      // Send response back to page
      window.postMessage(
        {
          target: 'vaultNFT-page',
          requestId: message.requestId,
          response,
        },
        '*'
      );
    } catch (error: any) {
      // Send error response back to page
      window.postMessage(
        {
          target: 'vaultNFT-page',
          requestId: message.requestId,
          response: {
            success: false,
            error: error.message || 'Unknown error',
          },
        },
        '*'
      );
    }
  }
});

console.log('VaultNFT content script ready');

window.addEventListener('message', async (event) => {
  if (event.source !== window) return;

  const message = event.data;

  if (message && message.target === 'vaultNFT-background') {
    console.log('📨 Content: Message to background:', message.type, message.data);
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: message.type,
        data: message.data,
        requestId: message.requestId,
      });

      console.log('📨 Content: Response from background:', response);

      window.postMessage(
        {
          target: 'vaultNFT-page',
          requestId: message.requestId,
          response,
        },
        '*'
      );
    } catch (error: any) {
      console.error('📨 Content: Error:', error);
      
      window.postMessage(
        {
          target: 'vaultNFT-page',
          requestId: message.requestId,
          response: {
            success: false,
            error: error.message || 'Unknown error',
          },
        },
        '*'
      );
    }
  }
});
