import type { Permission, PermissionRequest } from '@nft-wallet/shared';

const STORAGE_KEY = 'permissions';

/**
 * Get all permissions from storage
 */
async function getPermissions(): Promise<Permission[]> {
  const result = await chrome.storage.local.get([STORAGE_KEY]);
  return result[STORAGE_KEY] || [];
}

/**
 * Save permissions to storage
 */
async function savePermissions(permissions: Permission[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: permissions });
}

/**
 * Request permission for an origin
 */
export async function requestPermission(request: PermissionRequest): Promise<boolean> {
  const permissions = await getPermissions();

  // Check if permission already exists
  const existing = permissions.find(
    p => p.origin === request.origin && p.chain === request.chain
  );

  if (existing) {
    // Update existing permission
    existing.permissions = [...new Set([...existing.permissions, ...request.requestedPermissions])];
    if (request.requestedAccounts) {
      existing.accounts = [...new Set([...existing.accounts, ...request.requestedAccounts])];
    }
  } else {
    // Create new permission
    const newPermission: Permission = {
      origin: request.origin,
      chain: request.chain,
      permissions: request.requestedPermissions,
      accounts: request.requestedAccounts || [],
      grantedAt: Date.now(),
    };
    permissions.push(newPermission);
  }

  await savePermissions(permissions);
  return true;
}

/**
 * Check if origin has permission
 */
export async function checkPermission(origin: string, chain: 'ethereum' | 'solana'): Promise<boolean> {
  const permissions = await getPermissions();
  return permissions.some(p => p.origin === origin && p.chain === chain);
}

/**
 * Revoke permission for origin
 */
export async function revokePermission(origin: string): Promise<void> {
  const permissions = await getPermissions();
  const filtered = permissions.filter(p => p.origin !== origin);
  await savePermissions(filtered);
}

/**
 * List all permissions
 */
export async function listPermissions(): Promise<Permission[]> {
  return getPermissions();
}

/**
 * Get permission for origin and chain
 */
export async function getPermission(origin: string, chain: 'ethereum' | 'solana'): Promise<Permission | null> {
  const permissions = await getPermissions();
  return permissions.find(p => p.origin === origin && p.chain === chain) || null;
}
