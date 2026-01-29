import type { NormalizedNFT } from './nft.js';
import type { Settings, VaultData, Account } from './wallet.js';
import type { Permission, PermissionRequest } from './permissions.js';

/**
 * Message types for extension communication
 */
export type MessageType =
  // Wallet lifecycle
  | 'WALLET_CREATE'
  | 'WALLET_IMPORT'
  | 'WALLET_UNLOCK'
  | 'WALLET_LOCK'
  | 'WALLET_GET_STATE'
  // Account management
  | 'ACCOUNT_GET_CURRENT'
  | 'ACCOUNT_SWITCH'
  // NFT operations
  | 'NFT_FETCH_ALL'
  | 'NFT_FETCH_BY_CHAIN'
  | 'NFT_GET_CACHED'
  | 'NFT_SEND'
  // Settings
  | 'SETTINGS_UPDATE'
  | 'SETTINGS_GET'
  // Permissions
  | 'PERMISSION_REQUEST'
  | 'PERMISSION_CHECK'
  | 'PERMISSION_REVOKE'
  | 'PERMISSION_LIST'
  // Signing
  | 'SIGN_MESSAGE'
  | 'SIGN_TRANSACTION'
  | 'SEND_TRANSACTION';

/**
 * Base message structure
 */
export interface Message<T = any> {
  type: MessageType;
  data?: T;
  requestId?: string;
}

/**
 * Message response
 */
export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

/**
 * Wallet creation data
 */
export interface WalletCreateData {
  password: string;
  mnemonic?: string;
}

/**
 * Wallet unlock data
 */
export interface WalletUnlockData {
  password: string;
}

/**
 * Account switch data
 */
export interface AccountSwitchData {
  chain: 'ethereum' | 'solana';
  index: number;
}

/**
 * NFT send data
 */
export interface NFTSendData {
  nft: NormalizedNFT;
  to: string;
  amount?: number;
}

/**
 * Sign message data
 */
export interface SignMessageData {
  message: string;
  chain: 'ethereum' | 'solana';
  address: string;
}

/**
 * Sign transaction data
 */
export interface SignTransactionData {
  transaction: any;
  chain: 'ethereum' | 'solana';
  address: string;
}

/**
 * Send transaction data
 */
export interface SendTransactionData {
  transaction: any;
  chain: 'ethereum' | 'solana';
  address: string;
}
