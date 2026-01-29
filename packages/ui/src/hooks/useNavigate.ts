import { useState, useCallback } from 'react';
import type { NFT } from '@nft-wallet/shared';

export type PageType = 'home' | 'gallery' | 'nft-detail' | 'send' | 'settings';

interface PageData {
  nft?: NFT;
}

interface NavigationState {
  page: PageType;
  data?: PageData;
}

export const useNavigate = () => {
  const [state, setState] = useState<NavigationState>({ page: 'home' });

  const navigate = useCallback((page: PageType, data?: PageData) => {
    setState({ page, data });
  }, []);

  return navigate;
};

export const useNavigation = () => {
  const [state, setState] = useState<NavigationState>({ page: 'home' });

  const navigate = useCallback((page: PageType, data?: PageData) => {
    setState({ page, data });
  }, []);

  return { state, navigate };
};
