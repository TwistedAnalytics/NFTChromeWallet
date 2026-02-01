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
        const result = await chrome.storage.local.get(['vaultData', 'walletState']);
        const hasVault = !!result.vaultData;
        console.log('Vault check:', { 
          hasVault, 
          vaultData: result.vaultData,
          walletState: result.walletState 
        });
        
        setHasWallet(hasVault);

        // If vault exists, check background state
        if (hasVault) {
          const statusResponse = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
          console.log('Background status:', statusResponse);
          
          if (statusResponse.success && statusResponse.data) {
            const isUnlocked = statusResponse.data.isUnlocked;
            console.log('Is unlocked in background?', isUnlocked);
            
            if (isUnlocked) {
              // Sync UI with background
              store.setUnlocked(true);
              store.setAddress(statusResponse.data.address);
              store.setEthAddress(statusResponse.data.ethAddress);
            }
          }
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
        setHasWallet(false);
      }
    };

    checkWallet();
  }, []);

  // Auto-initialize balances when wallet is unlocked
  useEffect(() => {
    if (isUnlocked && address) {
      console.log('Wallet is unlocked, fetching balances...');
      
      // Reset activity on popup open
      chrome.runtime.sendMessage({ type: 'RESET_ACTIVITY' }).catch(() => {});
    
    useEffect(() => {
    const checkWallet = async () => {
      try {
        // Check if vault exists
        const result = await chrome.storage.local.get(['vaultData']);
        const hasVault = !!result.vaultData;
        console.log('Has vault:', hasVault);
        setHasWallet(hasVault);

        // If vault exists, check if it's unlocked in the background
        if (hasVault) {
          const statusResponse = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
          console.log('Background status:', statusResponse);
          
          if (statusResponse.success && statusResponse.data?.isUnlocked) {
            // Sync UI state with background state
            store.setUnlocked(true);
            store.setAddress(statusResponse.data.address);
            store.setEthAddress(statusResponse.data.ethAddress);
            console.log('✅ Wallet is unlocked in background, syncing UI state');
          } else {
            console.log('⚠️ Wallet is locked in background');
            store.setUnlocked(false);
          }
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
        setHasWallet(false);
      }
    };

    if (!isLoading) {
      checkWallet();
    }
  }, [isLoading]);

    // Auto-initialize balances when wallet is unlocked
  useEffect(() => {
    if (isUnlocked && address) {
      console.log('Wallet is unlocked, fetching balances...');
      
      // Reset activity on popup open
      chrome.runtime.sendMessage({ type: 'RESET_ACTIVITY' }).catch(() => {});
      
      chrome.runtime.sendMessage({ type: 'GET_BALANCE' }, (response) => {
        console.log('Auto-fetch balance response:', response);
      });
    }
  }, [isUnlocked, address]);

  // Reset activity timer on user interaction IN THE POPUP
  useEffect(() => {
    if (!isUnlocked) return;

    const resetActivity = () => {
      chrome.runtime.sendMessage({ type: 'RESET_ACTIVITY' }).catch(() => {});
    };

    // Only track interactions while popup is open
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    events.forEach(event => window.addEventListener(event, resetActivity));

    return () => {
      events.forEach(event => window.removeEventListener(event, resetActivity));
    };
  }, [isUnlocked]);

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
