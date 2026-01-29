import type { Message, MessageResponse } from '@nft-wallet/shared';

export const sendMessage = <T = any>(message: Message): Promise<MessageResponse<T>> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        resolve(response);
      }
    });
  });
};
