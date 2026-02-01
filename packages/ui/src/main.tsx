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
import { History } from './pages/History';

const AppContent: React.FC = () => {
  const { isUnlocked, address, isLoading, createWallet, unlockWallet } = useWallet();
  const { state } = useNavigation();
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const store = useWallet();

  useEffect(() => {
    const checkWallet = async () => {
      try {
        const result = await chrome.storage.local.get(['vaultData']);
        const hasVault = !!result.vaultData;
        console.log('Has vault:', hasVault);
        setHasWallet(hasVault);

        // If vault exists, check if background says it's unlocked
        if (hasVault) {
          const statusResponse = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
          console.log('Background status:', statusResponse);
          
          if (statusResponse.success && statusResponse.data?.isUnlocked) {
            // Background says unlocked, sync UI
            store.setUnlocked(true);
            store.setAddress(statusResponse.data.address);
            store.setEthAddress(statusResponse.data.ethAddress);
            console.log('✅ Synced with background: wallet is unlocked');
          }
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
        setHasWallet(false);
      }
    };

    checkWallet();
  }, []);

  // Auto-initialize balances when wallet is unlocked (with caching)
  useEffect(() => {
    if (isUnlocked && address) {
      console.log('Wallet is unlocked, checking cached balances...');
      
      // Reset activity on popup open
      chrome.runtime.sendMessage({ type: 'RESET_ACTIVITY' }).catch(() => {});
      
      // Check if we have recent cached balances (within 30 seconds)
      chrome.storage.local.get(['lastBalanceFetch', 'cachedSolBalance', 'cachedEthBalance']).then((result) => {
        const lastFetch = result.lastBalanceFetch || 0;
        const now = Date.now();
        const CACHE_DURATION = 30000; // 30 seconds
        
        if (now - lastFetch < CACHE_DURATION && result.cachedSolBalance && result.cachedEthBalance) {
          console.log('✅ Using cached balances (age:', Math.floor((now - lastFetch) / 1000), 'seconds)');
          store.setBalance(result.cachedSolBalance);
          store.setEthBalance(result.cachedEthBalance);
        } else {
          console.log('⏳ Fetching fresh balances...');
          chrome.runtime.sendMessage({ type: 'GET_BALANCE' }, (response) => {
            if (response?.success) {
              console.log('✅ Fresh balances fetched');
              // Cache the new balances
              chrome.storage.local.set({
                lastBalanceFetch: now,
                cachedSolBalance: response.data.balance,
                cachedEthBalance: response.data.ethBalance
              });
            }
          });
        }
      });
    }
  }, [isUnlocked, address]);
  
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
       case 'history':
        return <History />;
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
