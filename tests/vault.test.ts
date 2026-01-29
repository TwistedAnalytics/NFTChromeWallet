import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt, hashPassword } from '../packages/core/src/vault/crypto.js';
import { createMnemonic, isValidMnemonic, deriveEthereumKey, deriveSolanaKey } from '../packages/core/src/vault/keyDerivation.js';
import { Vault } from '../packages/core/src/vault/vault.js';

describe('Vault Crypto', () => {
  const password = 'Test1234!@#$';
  const testData = 'sensitive data to encrypt';

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const { encrypted, salt } = await encrypt(testData, password);
      expect(encrypted).toBeDefined();
      expect(salt).toBeDefined();
      expect(encrypted).not.toBe(testData);

      const decrypted = await decrypt(encrypted, salt, password);
      expect(decrypted).toBe(testData);
    });

    it('should fail decryption with wrong password', async () => {
      const { encrypted, salt } = await encrypt(testData, password);

      await expect(
        decrypt(encrypted, salt, 'wrongpassword')
      ).rejects.toThrow('Decryption failed');
    });

    it('should produce different encrypted data each time', async () => {
      const result1 = await encrypt(testData, password);
      const result2 = await encrypt(testData, password);

      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.salt).not.toBe(result2.salt);
    });

    it('should handle empty strings', async () => {
      const { encrypted, salt } = await encrypt('', password);
      const decrypted = await decrypt(encrypted, salt, password);
      expect(decrypted).toBe('');
    });

    it('should handle large data', async () => {
      const largeData = 'x'.repeat(10000);
      const { encrypted, salt } = await encrypt(largeData, password);
      const decrypted = await decrypt(encrypted, salt, password);
      expect(decrypted).toBe(largeData);
    });
  });

  describe('Password Hashing', () => {
    it('should hash password consistently', async () => {
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different passwords', async () => {
      const hash1 = await hashPassword('password1');
      const hash2 = await hashPassword('password2');
      expect(hash1).not.toBe(hash2);
    });
  });
});

describe('Key Derivation', () => {
  describe('Mnemonic Generation', () => {
    it('should generate valid 12-word mnemonic', () => {
      const mnemonic = createMnemonic();
      const words = mnemonic.split(' ');

      expect(words).toHaveLength(12);
      expect(isValidMnemonic(mnemonic)).toBe(true);
    });

    it('should generate different mnemonics each time', () => {
      const mnemonic1 = createMnemonic();
      const mnemonic2 = createMnemonic();

      expect(mnemonic1).not.toBe(mnemonic2);
    });

    it('should validate valid mnemonics', () => {
      const validMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      expect(isValidMnemonic(validMnemonic)).toBe(true);
    });

    it('should reject invalid mnemonics', () => {
      expect(isValidMnemonic('invalid mnemonic phrase')).toBe(false);
      expect(isValidMnemonic('abandon')).toBe(false);
      expect(isValidMnemonic('')).toBe(false);
    });
  });

  describe('Ethereum Key Derivation', () => {
    const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    it('should derive Ethereum keys consistently', () => {
      const key1 = deriveEthereumKey(testMnemonic, 0);
      const key2 = deriveEthereumKey(testMnemonic, 0);

      expect(key1.privateKey).toBe(key2.privateKey);
      expect(key1.publicKey).toBe(key2.publicKey);
      expect(key1.address).toBe(key2.address);
    });

    it('should derive different keys for different indices', () => {
      const key0 = deriveEthereumKey(testMnemonic, 0);
      const key1 = deriveEthereumKey(testMnemonic, 1);

      expect(key0.privateKey).not.toBe(key1.privateKey);
      expect(key0.address).not.toBe(key1.address);
    });

    it('should use correct derivation path', () => {
      const key = deriveEthereumKey(testMnemonic, 0);
      expect(key.derivationPath).toBe("m/44'/60'/0'/0/0");
    });

    it('should generate valid Ethereum address format', () => {
      const key = deriveEthereumKey(testMnemonic, 0);
      expect(key.address).toMatch(/^0x[0-9a-f]{40}$/i);
    });
  });

  describe('Solana Key Derivation', () => {
    const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    it('should derive Solana keys consistently', () => {
      const key1 = deriveSolanaKey(testMnemonic, 0);
      const key2 = deriveSolanaKey(testMnemonic, 0);

      expect(key1.privateKey).toBe(key2.privateKey);
      expect(key1.publicKey).toBe(key2.publicKey);
      expect(key1.address).toBe(key2.address);
    });

    it('should derive different keys for different indices', () => {
      const key0 = deriveSolanaKey(testMnemonic, 0);
      const key1 = deriveSolanaKey(testMnemonic, 1);

      expect(key0.privateKey).not.toBe(key1.privateKey);
      expect(key0.address).not.toBe(key1.address);
    });

    it('should use correct derivation path', () => {
      const key = deriveSolanaKey(testMnemonic, 0);
      expect(key.derivationPath).toBe("m/44'/501'/0'/0'");
    });
  });
});

describe('Vault', () => {
  let vault: Vault;
  const password = 'SecurePass123!';

  beforeEach(() => {
    vault = new Vault();
  });

  describe('Vault Creation', () => {
    it('should create new vault', async () => {
      const vaultData = await vault.create(password);

      expect(vaultData.encrypted).toBeDefined();
      expect(vaultData.salt).toBeDefined();
      expect(vaultData.version).toBe(1);
      expect(vault.isUnlocked()).toBe(true);
    });

    it('should create vault with custom mnemonic', async () => {
      const mnemonic = createMnemonic();
      const vaultData = await vault.create(password, mnemonic);

      expect(vaultData.encrypted).toBeDefined();
      expect(vault.getMnemonic()).toBe(mnemonic);
    });

    it('should reject invalid mnemonic', async () => {
      await expect(
        vault.create(password, 'invalid mnemonic')
      ).rejects.toThrow('Invalid mnemonic');
    });
  });

  describe('Vault Import', () => {
    it('should import wallet from mnemonic', async () => {
      const mnemonic = createMnemonic();
      const vaultData = await vault.import(password, mnemonic);

      expect(vaultData.encrypted).toBeDefined();
      expect(vault.getMnemonic()).toBe(mnemonic);
    });

    it('should reject invalid mnemonic on import', async () => {
      await expect(
        vault.import(password, 'invalid mnemonic')
      ).rejects.toThrow('Invalid mnemonic');
    });
  });

  describe('Vault Lock/Unlock', () => {
    it('should unlock vault with correct password', async () => {
      const vaultData = await vault.create(password);
      vault.lock();
      expect(vault.isUnlocked()).toBe(false);

      const content = await vault.unlock(vaultData, password);
      expect(vault.isUnlocked()).toBe(true);
      expect(content.mnemonic).toBeDefined();
      expect(content.accounts.ethereum).toHaveLength(1);
      expect(content.accounts.solana).toHaveLength(1);
    });

    it('should fail unlock with wrong password', async () => {
      const vaultData = await vault.create(password);
      vault.lock();

      await expect(
        vault.unlock(vaultData, 'wrongpassword')
      ).rejects.toThrow('Decryption failed');
    });

    it('should lock vault', async () => {
      await vault.create(password);
      expect(vault.isUnlocked()).toBe(true);

      vault.lock();
      expect(vault.isUnlocked()).toBe(false);
      expect(() => vault.getMnemonic()).toThrow('Vault is locked');
    });
  });

  describe('Message Signing', () => {
    it('should sign message when unlocked', async () => {
      await vault.create(password);
      const signature = await vault.signMessage('test message', 'ethereum', 0);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    it('should fail to sign when locked', async () => {
      await vault.create(password);
      vault.lock();

      await expect(
        vault.signMessage('test message', 'ethereum', 0)
      ).rejects.toThrow('Vault is locked');
    });
  });

  describe('Transaction Signing', () => {
    it('should sign transaction when unlocked', async () => {
      await vault.create(password);
      const tx = { to: '0x123', value: '1000' };
      const signedTx = await vault.signTransaction(tx, 'ethereum', 0);

      expect(signedTx).toBeDefined();
      expect(signedTx.signature).toBeDefined();
    });

    it('should fail to sign transaction when locked', async () => {
      await vault.create(password);
      vault.lock();

      await expect(
        vault.signTransaction({}, 'ethereum', 0)
      ).rejects.toThrow('Vault is locked');
    });
  });

  describe('Auto-lock', () => {
    it('should set auto-lock duration', async () => {
      await vault.create(password);
      vault.setAutoLockMinutes(10);
      expect(vault.isUnlocked()).toBe(true);
    });
  });
});
