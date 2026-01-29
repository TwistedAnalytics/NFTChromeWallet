import { useCallback } from 'react';
import { sendMessage } from '../utils/messaging';
import type { Message, MessageResponse } from '@nft-wallet/shared';

export const useMessaging = () => {
  const send = useCallback(async <T = any>(message: Message): Promise<MessageResponse<T>> => {
    return sendMessage<T>(message);
  }, []);

  return { send };
};
