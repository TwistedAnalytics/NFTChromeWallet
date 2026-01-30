import type { Message, MessageResponse } from '@nft-wallet/shared';

export const sendMessage = <T = any>(message: Message): Promise<MessageResponse<T>> => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.error('Message timeout:', message.type);
      resolve({
        success: false,
        error: `Request timeout for ${message.type}`,
      });
    }, 5000); // 5 second timeout

    try {
      chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
        clearTimeout(timeoutId);
        
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else if (!response) {
          console.error('No response received for:', message.type);
          resolve({
            success: false,
            error: 'No response from background script',
          });
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('sendMessage error:', error);
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
