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

export const useNavigation = () => {
  const [state, setState] = useState<NavigationState>({ page: 'home' });

  const navigate = useCallback((page: PageType, data?: PageData) => {
    console.log('Navigating to:', page);
    setState({ page, data });
  }, []);

  return { state, navigate };
};

export const useNavigate = () => {
  const { navigate } = useNavigation();
  return navigate;
};
