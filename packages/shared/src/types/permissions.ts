/**
 * Permission types
 */
export type PermissionType = 'connect' | 'sign_message' | 'sign_transaction' | 'send_transaction';

/**
 * Permission for a specific origin
 */
export interface Permission {
  origin: string;
  chain: 'ethereum' | 'solana';
  permissions: PermissionType[];
  accounts: string[];
  grantedAt: number;
}

/**
 * Permission request
 */
export interface PermissionRequest {
  origin: string;
  chain: 'ethereum' | 'solana';
  requestedPermissions: PermissionType[];
  requestedAccounts?: string[];
}
