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

// Create vaultNFT namespace
window.vaultNFT = {
  ethereum: ethereumProvider,
  solana: solanaProvider,
};

// Protect window.solana from being overwritten
Object.defineProperty(window, 'solana', {
  get() {
    return solanaProvider;
  },
  set(newProvider) {
    console.warn('Another wallet tried to overwrite window.solana, blocked!');
  },
  configurable: false,
});

// Set window.ethereum if not already set
if (!window.ethereum) {
  window.ethereum = ethereumProvider;
}

// Add phantom property for detection
if (!window.phantom) {
  window.phantom = {
    solana: solanaProvider,
  };
}

// Announce provider using EIP-6963
announceProvider(ethereumProvider);

// Dispatch ready events
window.dispatchEvent(new Event('solana#initialized'));
window.dispatchEvent(new Event('ethereum#initialized'));

console.log('VaultNFT providers ready and protected');
