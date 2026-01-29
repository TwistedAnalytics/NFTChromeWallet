/**
 * Network configuration
 */
export interface Network {
  id: string;
  name: string;
  chainId: number | string;
  rpcUrl: string;
  explorerUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Account in the wallet
 */
export interface Account {
  address: string;
  publicKey: string;
  derivationPath: string;
  index: number;
}

/**
 * Encrypted vault data
 */
export interface VaultData {
  encrypted: string;
  salt: string;
  version: number;
}

/**
 * Wallet settings
 */
export interface Settings {
  autoLockMinutes: number;
  ipfsGateway: string;
  spamFilterEnabled: boolean;
  selectedNetwork: {
    ethereum: string;
    solana: string;
  };
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: Settings = {
  autoLockMinutes: 5,
  ipfsGateway: 'cloudflare-ipfs.com',
  spamFilterEnabled: true,
  selectedNetwork: {
    ethereum: 'ethereum-mainnet',
    solana: 'solana-mainnet',
  },
};

/**
 * Wallet state
 */
export interface WalletState {
  isInitialized: boolean;
  isUnlocked: boolean;
  accounts: {
    ethereum: Account[];
    solana: Account[];
  };
  settings: Settings;
  vaultData?: VaultData;
}

/**
 * Default wallet state
 */
export const DEFAULT_WALLET_STATE: WalletState = {
  isInitialized: false,
  isUnlocked: false,
  accounts: {
    ethereum: [],
    solana: [],
  },
  settings: DEFAULT_SETTINGS,
};

/**
 * Predefined networks
 */
export const NETWORKS = {
  ethereum: [
    {
      id: 'ethereum-mainnet',
      name: 'Ethereum Mainnet',
      chainId: 1,
      rpcUrl: 'https://eth.llamarpc.com',
      explorerUrl: 'https://etherscan.io',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
    },
    {
      id: 'ethereum-sepolia',
      name: 'Sepolia Testnet',
      chainId: 11155111,
      rpcUrl: 'https://rpc.sepolia.org',
      explorerUrl: 'https://sepolia.etherscan.io',
      nativeCurrency: {
        name: 'Sepolia Ether',
        symbol: 'ETH',
        decimals: 18,
      },
    },
  ] as Network[],
  solana: [
    {
      id: 'solana-mainnet',
      name: 'Solana Mainnet',
      chainId: 'mainnet-beta',
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      explorerUrl: 'https://explorer.solana.com',
      nativeCurrency: {
        name: 'SOL',
        symbol: 'SOL',
        decimals: 9,
      },
    },
    {
      id: 'solana-devnet',
      name: 'Solana Devnet',
      chainId: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com',
      explorerUrl: 'https://explorer.solana.com?cluster=devnet',
      nativeCurrency: {
        name: 'SOL',
        symbol: 'SOL',
        decimals: 9,
      },
    },
  ] as Network[],
};
