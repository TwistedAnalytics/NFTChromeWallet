# @nft-wallet/ui

React-based user interface for the VaultNFT Chrome extension.

## Overview

This package contains the complete UI implementation for the NFT wallet extension, including:

- **Popup Interface**: Main wallet interface (360px wide)
- **Approval Flow**: Connection request handling
- **NFT Gallery**: Display and manage NFTs
- **Settings**: Network selection and connected sites management

## Technology Stack

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Zustand**: State management
- **Vite**: Build tool
- **Tailwind CSS**: Styling with dark theme

## Structure

```
src/
├── components/       # Reusable React components
│   ├── Layout.tsx           # Main layout with header
│   ├── NFTCard.tsx          # Individual NFT card
│   ├── NFTGallery.tsx       # NFT grid display
│   ├── NFTDetail.tsx        # Detailed NFT view
│   ├── SendNFT.tsx          # NFT transfer form
│   ├── WalletCreate.tsx     # Wallet creation/import
│   ├── WalletUnlock.tsx     # Unlock screen
│   ├── NetworkSelector.tsx  # Network switching
│   ├── ConnectedSites.tsx   # Connected sites list
│   └── ApprovalPrompt.tsx   # Connection approval
├── pages/            # Page components
│   ├── Home.tsx            # Dashboard
│   ├── Gallery.tsx         # NFT gallery page
│   ├── NFTView.tsx         # NFT detail page
│   ├── Send.tsx            # Send NFT page
│   └── Settings.tsx        # Settings page
├── hooks/            # Custom React hooks
│   ├── useWallet.ts        # Wallet state & operations
│   ├── useNFTs.ts          # NFT fetching & sending
│   ├── useMessaging.ts     # Chrome extension messaging
│   └── useNavigate.ts      # In-app navigation
├── store/            # State management
│   └── walletStore.ts      # Zustand store
├── utils/            # Utility functions
│   └── messaging.ts        # Message helper
├── main.tsx          # Main popup entry point
├── approval.tsx      # Approval popup entry point
└── index.css         # Global styles & Tailwind

```

## Features

### Wallet Management
- Create new wallet with seed phrase generation
- Import existing wallet from recovery phrase
- Secure password-based encryption
- Lock/unlock functionality

### NFT Features
- Browse NFT collection in grid layout
- View detailed NFT information and metadata
- Display NFT attributes and properties
- Send NFTs to other addresses
- Automatic NFT discovery via Alchemy API

### Network Support
- Ethereum Mainnet
- Goerli Testnet
- Sepolia Testnet
- Easy network switching

### Security
- Password-protected wallet access
- Site connection approval flow
- Connected sites management
- Session-based unlocking

## Build

### Development
```bash
pnpm dev
```

### Production
```bash
pnpm build
```

Outputs to `../extension/dist/`:
- `popup.html` / `popup.js` - Main popup
- `approval.html` / `approval.js` - Approval popup
- `index.css` - Compiled styles

## State Management

The UI uses Zustand for lightweight, efficient state management:

```typescript
interface WalletState {
  isUnlocked: boolean;
  address: string | null;
  balance: string;
  nfts: NFT[];
  currentNetwork: Network;
  connectedSites: string[];
  // ... actions
}
```

## Communication

Communicates with the background service worker via Chrome's messaging API:

```typescript
chrome.runtime.sendMessage(message, callback);
```

All message types are defined in `@nft-wallet/shared`.

## Styling

Uses Tailwind CSS with a dark theme optimized for the extension popup:

- Dark background: `bg-gray-900`
- Card backgrounds: `bg-gray-800`
- Primary color: Indigo (`indigo-600`)
- Custom utility classes for common patterns

## Navigation

Simple in-memory navigation system using React hooks:

- No router dependencies
- State-based page rendering
- Type-safe navigation with data passing
