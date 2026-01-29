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
  }
}

// Create vaultNFT namespace
window.vaultNFT = {
  ethereum: ethereumProvider,
  solana: solanaProvider,
};

// Set window.ethereum if not already set (don't override existing providers)
if (!window.ethereum) {
  window.ethereum = ethereumProvider;
}

// Announce provider using EIP-6963
announceProvider(ethereumProvider);

console.log('VaultNFT providers ready');
