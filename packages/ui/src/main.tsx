import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Layout } from './components/Layout';
import { WalletCreate } from './components/WalletCreate';
import { WalletUnlock } from './components/WalletUnlock';
import { Home } from './pages/Home';
import { Gallery } from './pages/Gallery';
import { NFTView } from './pages/NFTView';
import { Send } from './pages/Send';
import { Settings } from './pages/Settings';
import { useWallet } from './hooks/useWallet';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import './index.css';

const AppContent: React.FC = () => {
  const { isUnlocked, address, isLoading, createWallet, unlockWallet } = useWallet();
  const { state } = useNavigation();
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);

  useEffect(() => {
    const checkWallet = async () => {
      try {
        const result = await chrome.storage.local.get(['vaultData']);
        const hasVault = !!result.vaultData;
        console.log('Has vault:', hasVault, 'isUnlocked:', isUnlocked);
        setHasWallet(hasVault);
      } catch (error) {
        console.error('Error checking wallet:', error);
        setHasWallet(false);
      }
    };

    // Auto-initialize balances when wallet is unlocked
    useEffect(() => {
      if (isUnlocked && address) {
        console.log('Wallet is unlocked, fetching balances...');
        // Fetch balance from background
        chrome.runtime.sendMessage({ type: 'GET_BALANCE' }, (response) => {
          console.log('Auto-fetch balance response:', response);
        });
      }
    }, [isUnlocked, address]);
    
    if (!isLoading) {
      checkWallet();
    }
  }, [isLoading, isUnlocked]);

  if (isLoading || hasWallet === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasWallet && !isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <WalletCreate onSubmit={createWallet} />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <WalletUnlock onSubmit={unlockWallet} />
      </div>
    );
  }

  const renderPage = () => {
    switch (state.page) {
      case 'home':
        return <Home />;
      case 'gallery':
        return <Gallery />;
      case 'nft-detail':
        return state.data?.nft ? <NFTView nft={state.data.nft} /> : <Gallery />;
      case 'send':
        return state.data?.nft ? <Send nft={state.data.nft} /> : <Gallery />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
};

const App: React.FC = () => {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
