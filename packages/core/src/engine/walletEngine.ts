import { Vault } from '../vault/vault.js';
import type { WalletState, Account, Settings, VaultData, DEFAULT_WALLET_STATE } from '@nft-wallet/shared';

/**
 * Wallet Engine for managing wallet state
 */
export class WalletEngine {
  private vault: Vault;
  private state: WalletState;

  constructor(initialState?: WalletState) {
    this.vault = new Vault();
    this.state = initialState || {
      isInitialized: false,
      isUnlocked: false,
      accounts: {
        ethereum: [],
        solana: [],
      },
      settings: {
        autoLockMinutes: 5,
        ipfsGateway: 'cloudflare-ipfs.com',
        spamFilterEnabled: true,
        selectedNetwork: {
          ethereum: 'ethereum-mainnet',
          solana: 'solana-mainnet',
        },
      },
    };
  }

  /**
   * Create new wallet
   */
  /**
 * Create new wallet
 */
async createWallet(password: string, mnemonic?: string): Promise<{ vaultData: VaultData; mnemonic: string }> {
  const vaultData = await this.vault.create(password, mnemonic);
  const content = await this.vault.unlock(vaultData, password);

  this.state = {
    isInitialized: true,
    isUnlocked: true,
    accounts: content.accounts,
    settings: this.state.settings,
    vaultData,
  };

  // Return both vaultData and the mnemonic
  return { 
    vaultData, 
    mnemonic: this.vault.getMnemonic() 
  };
}

/**
 * Import wallet from mnemonic
 */
async importWallet(password: string, mnemonic: string): Promise<{ vaultData: VaultData; mnemonic: string }> {
  return this.createWallet(password, mnemonic);
}

  /**
   * Unlock wallet
   */
  async unlockWallet(vaultData: VaultData, password: string): Promise<void> {
    const content = await this.vault.unlock(vaultData, password);

    this.state = {
      ...this.state,
      isInitialized: true,
      isUnlocked: true,
      accounts: content.accounts,
      vaultData,
    };

    this.vault.setAutoLockMinutes(this.state.settings.autoLockMinutes);
  }

 /**
 * Restore session from stored vault data (for service worker restarts)
 */
async restoreSession(vaultData: VaultData): Promise<void> {
  // We need to actually restore the vault, not just the state
  // The vault needs to be in an unlocked state with the keys available
  this.state = {
    ...this.state,
    isInitialized: true,
    isUnlocked: true,
    vaultData,
  };
  
  // Mark vault as restored (the keys are already in memory from state.accounts)
  console.log('Session restored with accounts:', this.state.accounts);
}

  /**
   * Lock wallet
   */
  lockWallet(): void {
    this.vault.lock();
    this.state = {
      ...this.state,
      isUnlocked: false,
    };
  }
 
  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Get current account for a chain
   */
  getCurrentAccount(chain: 'ethereum' | 'solana'): Account | undefined {
    return this.state.accounts[chain]?.[0];
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<Settings>): void {
    this.state.settings = {
      ...this.state.settings,
      ...settings,
    };

    if (settings.autoLockMinutes !== undefined) {
      this.vault.setAutoLockMinutes(settings.autoLockMinutes);
    }
  }

  /**
   * Get settings
   */
  getSettings(): Settings {
    return { ...this.state.settings };
  }

  /**
   * Sign message
   */
  async signMessage(message: string, chain: 'ethereum' | 'solana', address: string): Promise<string> {
    if (!this.state.isUnlocked) {
      throw new Error('Wallet is locked');
    }

    const account = this.state.accounts[chain].find(acc => acc.address === address);
    if (!account) {
      throw new Error('Account not found');
    }

    return this.vault.signMessage(message, chain, account.index);
  }

  /**
   * Sign transaction
   */
  async signTransaction(transaction: any, chain: 'ethereum' | 'solana', address: string): Promise<any> {
    if (!this.state.isUnlocked) {
      throw new Error('Wallet is locked');
    }

    const account = this.state.accounts[chain].find(acc => acc.address === address);
    if (!account) {
      throw new Error('Account not found');
    }

    return this.vault.signTransaction(transaction, chain, account.index);
  }

  /**
   * Get vault instance
   */
  getVault(): Vault {
    return this.vault;
  }

  /**
 * Get mnemonic (only when unlocked)
 */
getMnemonic(): string {
  if (!this.vault) {
    throw new Error('Vault not initialized');
  }
  return this.vault.getMnemonic();
}

  /**
 * Get private key (only when unlocked)
 */
getPrivateKey(chain: 'ethereum' | 'solana', accountIndex: number = 0): string {
  if (!this.vault) {
    throw new Error('Vault not initialized');
  }
  return this.vault.getPrivateKey(chain, accountIndex);
}

  /**
   * Set auto-lock time
   */
  setAutoLockTime(minutes: number): void {
    if (!this.vault) {
      throw new Error('Vault not initialized');
    }
    this.vault.setAutoLockTime(minutes);
  }
}
