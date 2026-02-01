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

// Inject as Phantom for compatibility
if (!window.solana) {
  window.solana = solanaProvider;
}

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

console.log('VaultNFT providers ready');

// Announce Solana wallet
if (typeof window !== 'undefined') {
  // Set wallet as available
  window.solana = solanaProvider;
  
  // Dispatch ready event
  window.dispatchEvent(new Event('solana#initialized'));
  
  // Also announce as a standard wallet for Magic Eden detection
  window.dispatchEvent(new CustomEvent('wallet-standard:register', {
    detail: {
      name: 'VaultNFT',
      icon: 'data:image/svg+xml;base64,...', // Your icon
      chains: ['solana:mainnet'],
      features: ['solana:signTransaction', 'solana:signMessage'],
    }
  }));
  
  console.log('🎯 VaultNFT Solana provider injected and announced');
}

// Announce Ethereum wallet
if (typeof window !== 'undefined') {
  window.ethereum = ethereumProvider;
  
  window.dispatchEvent(new Event('ethereum#initialized'));
  
  console.log('🎯 VaultNFT Ethereum provider injected');
}
