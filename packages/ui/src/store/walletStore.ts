import { create } from 'zustand';
import type { NFT } from '@nft-wallet/shared';

interface WalletState {
  isUnlocked: boolean;
  address: string | null;
  ethAddress: string | null;
  balance: string;
  ethBalance: string;
  nfts: NFT[];
  currentNetwork: string;
  connectedSites: string[];
  isLoading: boolean;
  error: string | null;

  setUnlocked: (unlocked: boolean) => void;
  setAddress: (address: string | null) => void;
  setEthAddress: (address: string | null) => void;
  setBalance: (balance: string) => void;
  setEthBalance: (balance: string) => void;
  setNFTs: (nfts: NFT[]) => void;
  setCurrentNetwork: (network: string) => void;
  setConnectedSites: (sites: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  isUnlocked: false,
  address: null,
  ethAddress: null,
  balance: '0',
  ethBalance: '0',
  nfts: [],
  currentNetwork: 'mainnet',
  connectedSites: [],
  isLoading: false,
  error: null,
};

export const useWalletStore = create<WalletState>((set) => ({
  ...initialState,

  setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),
  setAddress: (address) => set({ address }),
  setEthAddress: (ethAddress) => set({ ethAddress }),
  setBalance: (balance) => set({ balance }),
  setEthBalance: (ethBalance) => set({ ethBalance }),
  setNFTs: (nfts) => set({ nfts }),
  setCurrentNetwork: (network) => set({ currentNetwork: network }),
  setConnectedSites: (sites) => set({ connectedSites: sites }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
