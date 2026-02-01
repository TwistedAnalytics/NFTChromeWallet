import { EthereumProvider } from './ethereum.js';
import { SolanaProvider } from './solana.js';
import { announceProvider } from './eip6963.js';

console.log('VaultNFT provider initializing...');

// Create providers
const ethereumProvider = new EthereumProvider();
const solanaProvider = new SolanaProvider();

// Inject into window
declare global {
  interface Window {
    ethereum?: any;
    vaultNFT?: any;
    solana?: any;
    phantom?: any;
  }
}

// Always create vaultNFT namespace (guaranteed to work)
window.vaultNFT = {
  ethereum: ethereumProvider,
  solana: solanaProvider,
};

// Try to set window.solana (may fail if Phantom is already loaded)
try {
  if (!window.solana) {
    // No wallet yet, we can claim it
    Object.defineProperty(window, 'solana', {
      get() {
        return solanaProvider;
      },
      set(newProvider) {
        console.warn('VaultNFT: Another wallet tried to overwrite window.solana');
      },
      configurable: true, // Allow other wallets to override if needed
    });
    console.log('✅ VaultNFT claimed window.solana');
  } else {
    console.log('⚠️ VaultNFT: window.solana already exists (another wallet is active). Use window.vaultNFT.solana instead.');
  }
} catch (error) {
  console.warn('VaultNFT: Could not set window.solana:', error);
}

// Try to set window.ethereum (may fail if MetaMask is already loaded)
try {
  if (!window.ethereum) {
    window.ethereum = ethereumProvider;
    console.log('✅ VaultNFT claimed window.ethereum');
  } else {
    console.log('⚠️ VaultNFT: window.ethereum already exists (another wallet is active). Use window.vaultNFT.ethereum instead.');
  }
} catch (error) {
  console.warn('VaultNFT: Could not set window.ethereum:', error);
}

// Add phantom property for detection (optional, don't override if exists)
try {
  if (!window.phantom) {
    window.phantom = {
      solana: solanaProvider,
    };
  }
} catch (error) {
  console.warn('VaultNFT: Could not set window.phantom:', error);
}

// Announce provider using EIP-6963
try {
  announceProvider(ethereumProvider);
} catch (error) {
  console.warn('VaultNFT: Could not announce provider:', error);
}

// Dispatch ready events
try {
  window.dispatchEvent(new Event('vaultNFT#initialized'));
  window.dispatchEvent(new Event('solana#initialized'));
  window.dispatchEvent(new Event('ethereum#initialized'));
} catch (error) {
  console.warn('VaultNFT: Could not dispatch events:', error);
}

console.log('✅ VaultNFT providers ready (accessible via window.vaultNFT)');
