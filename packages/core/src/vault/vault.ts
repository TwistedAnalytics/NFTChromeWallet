import { encrypt, decrypt } from './crypto.js';
import { createMnemonic, isValidMnemonic, deriveEthereumKey, deriveSolanaKey } from './keyDerivation.js';
import type { VaultData, Account } from '@nft-wallet/shared';

/**
 * Vault data structure
 */
interface VaultContent {
  mnemonic: string;
  accounts: {
    ethereum: Account[];
    solana: Account[];
  };
  version: number;
}

/**
 * Vault class for secure key management
 */
export class Vault {
  private mnemonic?: string;
  private password?: string;
  private autoLockTimer?: NodeJS.Timeout;
  private autoLockMinutes: number = 15;

  /**
   * Create a new vault with a generated mnemonic
   */
  async create(password: string, customMnemonic?: string): Promise<VaultData> {
    const mnemonic = customMnemonic || createMnemonic();

    if (!isValidMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    this.mnemonic = mnemonic;
    this.password = password;

    // Derive initial accounts
    const ethAccount = deriveEthereumKey(mnemonic, 0);
    const solAccount = deriveSolanaKey(mnemonic, 0);

    const vaultContent: VaultContent = {
      mnemonic,
      accounts: {
        ethereum: [
          {
            address: ethAccount.address,
            publicKey: ethAccount.publicKey,
            derivationPath: ethAccount.derivationPath,
            index: 0,
          },
        ],
        solana: [
          {
            address: solAccount.address,
            publicKey: solAccount.publicKey,
            derivationPath: solAccount.derivationPath,
            index: 0,
          },
        ],
      },
      version: 1,
    };

    const { encrypted, salt } = await encrypt(JSON.stringify(vaultContent), password);

    this.startAutoLockTimer();

    return {
      encrypted,
      salt,
      version: 1,
    };
  }

  /**
   * Import existing vault from mnemonic
   */
  async import(password: string, mnemonic: string): Promise<VaultData> {
    if (!isValidMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    return this.create(password, mnemonic);
  }

  /**
   * Unlock vault with password
   */
  async unlock(vaultData: VaultData, password: string): Promise<VaultContent> {
    const decrypted = await decrypt(vaultData.encrypted, vaultData.salt, password);
    const content: VaultContent = JSON.parse(decrypted);

    this.mnemonic = content.mnemonic;
    this.password = password;

    this.startAutoLockTimer();

    return content;
  }

  /**
   * Lock the vault
   */
  lock(): void {
    this.mnemonic = undefined;
    this.password = undefined;
    this.clearAutoLockTimer();
  }

  /**
   * Check if vault is unlocked
   */
  isUnlocked(): boolean {
    return !!this.mnemonic && !!this.password;
  }

  /**
   * Get mnemonic (only when unlocked)
   */
  getMnemonic(): string {
    if (!this.mnemonic) {
      throw new Error('Vault is locked');
    }
    return this.mnemonic;
  }

  /**
   * Sign message with private key
   */
  async signMessage(message: string, chain: 'ethereum' | 'solana', index: number = 0): Promise<string> {
    if (!this.mnemonic) {
      throw new Error('Vault is locked');
    }

    const key = chain === 'ethereum'
      ? deriveEthereumKey(this.mnemonic, index)
      : deriveSolanaKey(this.mnemonic, index);

    // In a real implementation, this would use the appropriate signing algorithm
    // For Ethereum: secp256k1 signature
    // For Solana: ed25519 signature
    const signature = `signed:${message}:${key.privateKey.slice(0, 10)}`;

    this.resetAutoLockTimer();

    return signature;
  }

  /**
   * Sign transaction with private key
   */
  async signTransaction(transaction: any, chain: 'ethereum' | 'solana', index: number = 0): Promise<any> {
    if (!this.mnemonic) {
      throw new Error('Vault is locked');
    }

    const key = chain === 'ethereum'
      ? deriveEthereumKey(this.mnemonic, index)
      : deriveSolanaKey(this.mnemonic, index);

    // In a real implementation, this would sign the transaction
    const signedTx = {
      ...transaction,
      signature: `sig:${key.privateKey.slice(0, 10)}`,
    };

    this.resetAutoLockTimer();

    return signedTx;
  }

  /**
   * Set auto-lock duration
   */
  setAutoLockMinutes(minutes: number): void {
    this.autoLockMinutes = minutes;
    if (this.isUnlocked()) {
      this.resetAutoLockTimer();
    }
  }

  /**
   * Set auto-lock timeout
   */
  setAutoLockTime(minutes: number): void {
    this.autoLockMinutes = minutes;
    if (this.isUnlocked()) {
      this.startAutoLockTimer();
    }
  }

  /**
   * Start auto-lock timer
   */
  private startAutoLockTimer(): void {
    this.clearAutoLockTimer();
    this.autoLockTimer = setTimeout(() => {
      this.lock();
    }, this.autoLockMinutes * 60 * 1000);
  }

  /**
   * Reset auto-lock timer
   */
  private resetAutoLockTimer(): void {
    if (this.isUnlocked()) {
      this.startAutoLockTimer();
    }
  }

  /**
   * Clear auto-lock timer
   */
  private clearAutoLockTimer(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = undefined;
    }
  }
}
