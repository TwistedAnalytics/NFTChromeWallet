# NFT Wallet - Multi-Chain Chrome Extension

A secure, multi-chain NFT wallet supporting Ethereum and Solana networks.

## Features
- 🔐 Secure vault with AES-256-GCM encryption
- ⛓️ Multi-chain support (Ethereum + Solana)
- 🖼️ NFT gallery with ERC-721, ERC-1155, and Metaplex support
- 🚫 Spam detection and filtering
- 🔗 IPFS and Arweave support
- 🔌 EIP-1193 and EIP-6963 compatible
- 📱 MWA-aligned RPC interface for future mobile port

## Prerequisites
- Node.js 18+
- pnpm 8+

## Install
```bash
pnpm install
```

## Build
```bash
pnpm build
```

## Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer Mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `packages/extension/dist` directory
5. The VaultNFT icon should appear in your extensions

## Run Tests
```bash
pnpm test
```

## Development
```bash
pnpm dev  # Watch mode for all packages
```

## Architecture
- **Monorepo**: pnpm workspaces with TypeScript
- **Security**: PBKDF2 (600k iterations) + AES-256-GCM
- **Key Derivation**: BIP-39 → BIP-44
- **Networks**: Ethereum (mainnet/Sepolia), Solana (mainnet/devnet)
- **Storage**: chrome.storage.local (encrypted vault)
- **Manifest**: V3 with service worker background

## Package Structure
- `@nft-wallet/shared` - Shared types and utilities
- `@nft-wallet/core` - Wallet engine and vault
- `@nft-wallet/evm` - Ethereum chain support
- `@nft-wallet/sol` - Solana chain support
- `@nft-wallet/extension` - Chrome extension
- `@nft-wallet/ui` - React UI components

## Security Notes
- Private keys never leave the service worker
- Auto-lock after 5 minutes (configurable)
- Per-origin permission system
- No remote code execution
- Content Security Policy enforced

## License
MIT
