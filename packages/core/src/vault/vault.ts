import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from '@noble/hashes/utils';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { secp256k1 } from '@noble/curves/secp256k1';
import type { VaultData, VaultContent, Account } from '@nft-wallet/shared';

export class Vault {
  private encryptionKey: Uint8Array | null = null;
  private content: VaultContent | null = null;
  private unlocked: boolean = false;
  private autoLockTimer: NodeJS.Timeout | null = null;
  private autoLockMinutes: number = 5;

  /**
   * Create new vault with password
   */
  async create(password: string, mnemonic?: string): Promise<VaultData> {
    // Generate or validate mnemonic
    const mnemonicPhrase = mnemonic || generateMnemonic(wordlist, 128);
    if (!validateMnemonic(mnemonicPhrase, wordlist)) {
      throw new Error('Invalid mnemonic phrase');
    }

    // Derive seed from mnemonic
    const seed = mnemonicToSeedSync(mnemonicPhrase);
    
    // Generate accounts
    const accounts = this.generateAccounts(seed);

    // Create vault content
    this.content = {
      mnemonic: mnemonicPhrase,
      accounts,
    };

    // Generate encryption key from password
    const salt = randomBytes(32);
    this.encryptionKey = pbkdf2(sha256, password, salt, { c: 100000, dkLen: 32 });

    // Encrypt content
    const contentBytes = new TextEncoder().encode(JSON.stringify(this.content));
    const encryptedContent = this.xorEncrypt(contentBytes, this.encryptionKey);

    this.unlocked = true;
    this.startAutoLockTimer();

    return {
      version: 1,
      salt: Array.from(salt),
      encryptedContent: Array.from(encryptedContent),
    };
  }

  /**
   * Unlock vault with password
   */
  async unlock(vaultData: VaultData, password: string): Promise<VaultContent> {
    // Derive encryption key from password
    const salt = new Uint8Array(vaultData.salt);
    this.encryptionKey = pbkdf2(sha256, password, salt, { c: 100000, dkLen: 32 });

    // Decrypt content
    const encryptedContent = new Uint8Array(vaultData.encryptedContent);
    const decryptedBytes = this.xorEncrypt(encryptedContent, this.encryptionKey);
    
    try {
      const contentJson = new TextDecoder().decode(decryptedBytes);
      this.content = JSON.parse(contentJson);
      this.unlocked = true;
      this.startAutoLockTimer();
      return this.content!;
    } catch (error) {
      this.encryptionKey = null;
      throw new Error('Invalid password');
    }
  }

  /**
   * Lock vault
   */
  lock(): void {
    this.encryptionKey = null;
    this.content = null;
    this.unlocked = false;
    this.stopAutoLockTimer();
  }

  /**
   * Check if vault is unlocked
   */
  isUnlocked(): boolean {
    return this.unlocked;
  }

  /**
   * Get mnemonic (only when unlocked)
   */
  getMnemonic(): string {
    if (!this.unlocked || !this.content) {
      throw new Error('Vault is locked');
    }
    return this.content.mnemonic;
  }

  /**
   * Get private key for a specific chain and account index
   */
  getPrivateKey(chain: 'ethereum' | 'solana', accountIndex: number = 0): string {
    if (!this.unlocked || !this.content) {
      throw new Error('Vault is locked');
    }
    
    const account = this.content.accounts[chain]?.[accountIndex];
    if (!account) {
      throw new Error(`Account not found for ${chain} at index ${accountIndex}`);
    }
    
    return account.privateKey;
  }

  /**
   * Sign message
   */
  async signMessage(message: string, chain: 'ethereum' | 'solana', accountIndex: number = 0): Promise<string> {
    if (!this.unlocked || !this.content) {
      throw new Error('Vault is locked');
    }

    const account = this.content.accounts[chain][accountIndex];
    if (!account) {
      throw new Error('Account not found');
    }

    const messageHash = sha256(new TextEncoder().encode(message));
    const privateKeyBytes = this.hexToBytes(account.privateKey);
    const signature = secp256k1.sign(messageHash, privateKeyBytes);

    return signature.toCompactHex();
  }

  /**
   * Sign transaction
   */
  async signTransaction(transaction: any, chain: 'ethereum' | 'solana', accountIndex: number = 0): Promise<any> {
    if (!this.unlocked || !this.content) {
      throw new Error('Vault is locked');
    }

    const account = this.content.accounts[chain][accountIndex];
    if (!account) {
      throw new Error('Account not found');
    }

    // Transaction signing would be implemented here based on chain
    // For now, return a placeholder
    return {
      ...transaction,
      signature: await this.signMessage(JSON.stringify(transaction), chain, accountIndex),
    };
  }

  /**
   * Set auto-lock time in minutes
   */
  setAutoLockMinutes(minutes: number): void {
    this.autoLockMinutes = minutes;
    if (this.unlocked) {
      this.startAutoLockTimer();
    }
  }

  /**
   * Generate accounts from seed
   */
  private generateAccounts(seed: Uint8Array): { ethereum: Account[]; solana: Account[] } {
    const hdKey = HDKey.fromMasterSeed(seed);

    // Ethereum account (m/44'/60'/0'/0/0)
    const ethPath = "m/44'/60'/0'/0/0";
    const ethKey = hdKey.derive(ethPath);
    const ethPrivateKey = ethKey.privateKey!;
    const ethPublicKey = secp256k1.getPublicKey(ethPrivateKey, false);
    const ethAddress = this.publicKeyToEthAddress(ethPublicKey);

    // Solana account (m/44'/501'/0'/0')
    const solPath = "m/44'/501'/0'/0'";
    const solKey = hdKey.derive(solPath);
    const solPrivateKey = solKey.privateKey!;
    const solPublicKey = secp256k1.getPublicKey(solPrivateKey, true);
    const solAddress = this.bytesToBase58(solPublicKey);

    return {
      ethereum: [{
        address: ethAddress,
        publicKey: this.bytesToHex(ethPublicKey),
        privateKey: this.bytesToHex(ethPrivateKey),
        derivationPath: ethPath,
        index: 0,
      }],
      solana: [{
        address: solAddress,
        publicKey: this.bytesToHex(solPublicKey),
        privateKey: this.bytesToHex(solPrivateKey),
        derivationPath: solPath,
        index: 0,
      }],
    };
  }

  /**
   * XOR encryption/decryption
   */
  private xorEncrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] ^ key[i % key.length];
    }
    return result;
  }

  /**
   * Convert public key to Ethereum address
   */
  private publicKeyToEthAddress(publicKey: Uint8Array): string {
    // Take last 20 bytes of keccak256 hash
    const hash = sha256(publicKey.slice(1)); // Remove first byte (0x04)
    const address = hash.slice(-20);
    return '0x' + this.bytesToHex(address);
  }

  /**
   * Convert bytes to hex string
   */
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to bytes
   */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  /**
   * Convert bytes to Base58 (for Solana addresses)
   */
  private bytesToBase58(bytes: Uint8Array): string {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const base = BigInt(58);
    
    let num = BigInt('0x' + this.bytesToHex(bytes));
    let result = '';
    
    while (num > 0) {
      const remainder = num % base;
      result = ALPHABET[Number(remainder)] + result;
      num = num / base;
    }
    
    // Add leading 1s for leading zeros
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
      result = '1' + result;
    }
    
    return result;
  }

  /**
   * Start auto-lock timer
   */
  private startAutoLockTimer(): void {
    this.stopAutoLockTimer();
    this.autoLockTimer = setTimeout(() => {
      this.lock();
    }, this.autoLockMinutes * 60 * 1000);
  }

  /**
   * Stop auto-lock timer
   */
  private stopAutoLockTimer(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }
  }
}
