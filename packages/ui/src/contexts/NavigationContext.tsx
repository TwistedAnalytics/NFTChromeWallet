import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { NFT } from '@nft-wallet/shared';

export type PageType = 'home' | 'gallery' | 'nft-detail' | 'send' | 'settings' | 'history';

interface PageData {
  nft?: NFT;
}

interface NavigationState {
  page: PageType;
  data?: PageData;
}

interface NavigationContextType {
  state: NavigationState;
  navigate: (page: PageType, data?: PageData) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NavigationState>({ page: 'home' });

  const navigate = useCallback((page: PageType, data?: PageData) => {
    console.log('Navigating to:', page, data);
    setState({ page, data });
  }, []);

  return (
    <NavigationContext.Provider value={{ state, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
