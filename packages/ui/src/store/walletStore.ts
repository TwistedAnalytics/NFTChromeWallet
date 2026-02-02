import { create } from 'zustand';
import type { NFT, Network } from '@nft-wallet/shared';

interface WalletState {
  isUnlocked: boolean;
  address: string | null;  // Solana address
  ethAddress: string | null;  // Add Ethereum address
  balance: string;  // SOL balance
  ethBalance: string;  // Add ETH balance
  nfts: NFT[];
  currentNetwork: Network;
  connectedSites: string[];
  isLoading: boolean;
  error: string | null;

  setUnlocked: (unlocked: boolean) => void;
  setAddress: (address: string | null) => void;
  setEthAddress: (address: string | null) => void;  // Add setter
  setBalance: (balance: string) => void;
  setEthBalance: (balance: string) => void;  // Add setter
  setNFTs: (nfts: NFT[]) => void;
  setCurrentNetwork: (network: Network) => void;
  setConnectedSites: (sites: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  isUnlocked: false,
  address: null,
  ethAddress: null,  // Add this
  balance: '0',
  ethBalance: '0',  // Add this
  nfts: [],
  selectedNetwork: (storedState?.selectedNetwork || 'mainnet') as any,
  connectedSites: [],
  isLoading: false,
  error: null,
};

export const useWalletStore = create<WalletState>((set) => ({
  ...initialState,

  setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),
  setAddress: (address) => set({ address }),
  setEthAddress: (ethAddress) => set({ ethAddress }),  // Add this
  setBalance: (balance) => set({ balance }),
  setEthBalance: (ethBalance) => set({ ethBalance }),  // Add this
  setNFTs: (nfts) => set({ nfts }),
  setCurrentNetwork: (network) => set({ currentNetwork: network }),
  setConnectedSites: (sites) => set({ connectedSites: sites }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
