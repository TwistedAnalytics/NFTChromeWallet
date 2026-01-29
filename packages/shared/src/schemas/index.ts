import { z } from 'zod';

/**
 * Message schema
 */
export const MessageSchema = z.object({
  type: z.string(),
  data: z.any().optional(),
  requestId: z.string().optional(),
});

/**
 * Wallet create schema
 */
export const WalletCreateSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  mnemonic: z.string().optional(),
});

/**
 * Wallet unlock schema
 */
export const WalletUnlockSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

/**
 * Settings schema
 */
export const SettingsSchema = z.object({
  autoLockMinutes: z.number().min(1).max(60),
  ipfsGateway: z.string().min(1),
  spamFilterEnabled: z.boolean(),
  selectedNetwork: z.object({
    ethereum: z.string(),
    solana: z.string(),
  }),
});

/**
 * NFT send schema
 */
export const NFTSendSchema = z.object({
  nft: z.any(),
  to: z.string().min(1, 'Recipient address is required'),
  amount: z.number().min(1).optional(),
});

/**
 * Permission request schema
 */
export const PermissionRequestSchema = z.object({
  origin: z.string().min(1),
  chain: z.enum(['ethereum', 'solana']),
  requestedPermissions: z.array(z.string()),
  requestedAccounts: z.array(z.string()).optional(),
});

/**
 * Sign message schema
 */
export const SignMessageSchema = z.object({
  message: z.string().min(1),
  chain: z.enum(['ethereum', 'solana']),
  address: z.string().min(1),
});

/**
 * Transaction schema
 */
export const TransactionSchema = z.object({
  transaction: z.any(),
  chain: z.enum(['ethereum', 'solana']),
  address: z.string().min(1),
});
