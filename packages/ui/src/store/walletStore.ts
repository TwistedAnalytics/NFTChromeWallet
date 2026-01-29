import { create } from 'zustand';
import type { NFT, Network } from '@nft-wallet/shared';

interface WalletState {
  isUnlocked: boolean;
  address: string | null;
  balance: string;
  nfts: NFT[];
  currentNetwork: Network;
  connectedSites: string[];
  isLoading: boolean;
  error: string | null;

  setUnlocked: (unlocked: boolean) => void;
  setAddress: (address: string | null) => void;
  setBalance: (balance: string) => void;
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
  balance: '0',
  nfts: [],
  currentNetwork: 'mainnet' as Network,
  connectedSites: [],
  isLoading: false,
  error: null,
};

export const useWalletStore = create<WalletState>((set) => ({
  ...initialState,

  setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),
  setAddress: (address) => set({ address }),
  setBalance: (balance) => set({ balance }),
  setNFTs: (nfts) => set({ nfts }),
  setCurrentNetwork: (network) => set({ currentNetwork: network }),
  setConnectedSites: (sites) => set({ connectedSites: sites }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
