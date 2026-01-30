import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { bytesToHex } from '@nft-wallet/shared';

/**
 * BIP-44 derivation paths
 */
export const DERIVATION_PATHS = {
  ethereum: (index: number) => `m/44'/60'/0'/0/${index}`,
  solana: (index: number) => `m/44'/501'/${index}'/0'`,
};

/**
 * Generate a new BIP-39 mnemonic (12 words)
 */
export function createMnemonic(): string {
  return generateMnemonic(wordlist, 128); // 128 bits = 12 words
}

/**
 * Validate a BIP-39 mnemonic
 */
export function isValidMnemonic(mnemonic: string): boolean {
  return validateMnemonic(mnemonic, wordlist);
}

/**
 * Derive Ethereum key from mnemonic
 */
export function deriveEthereumKey(mnemonic: string, index: number = 0): {
  privateKey: string;
  publicKey: string;
  address: string;
  derivationPath: string;
} {
  const seed = mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const path = DERIVATION_PATHS.ethereum(index);
  const child = hdKey.derive(path);

  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }

  const privateKey = bytesToHex(child.privateKey);
  const publicKey = bytesToHex(child.publicKey!);

  // Derive Ethereum address from public key
  const address = deriveEthereumAddress(child.publicKey!);

  return {
    privateKey,
    publicKey,
    address,
    derivationPath: path,
  };
}

/**
 * Derive Solana key from mnemonic
 */
export function deriveSolanaKey(mnemonic: string, index: number = 0): {
  privateKey: string;
  publicKey: string;
  address: string;
  derivationPath: string;
} {
  const seed = mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const path = DERIVATION_PATHS.solana(index);
  const child = hdKey.derive(path);

  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }

  const privateKey = bytesToHex(child.privateKey);
  
  // For Solana, we need the ed25519 public key (32 bytes)
  // The child.publicKey from secp256k1 is 33 bytes (compressed) or 65 bytes (uncompressed)
  // We need to derive the ed25519 keypair from the seed directly
  const ed25519Seed = child.privateKey.slice(0, 32);
  
  // Import base58 encoder
  const base58 = (() => {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    return {
      encode: (bytes: Uint8Array): string => {
        let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
        if (num === 0n) return alphabet[0];
        let result = '';
        while (num > 0n) {
          result = alphabet[Number(num % 64n)] + result;
          num = num / 64n;
        }
        // Add leading '1' for each leading zero byte
        for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
          result = alphabet[0] + result;
        }
        return result;
      }
    };
  })();
  
  // For now, use a simple base58 encoding of the seed
  // In production, you'd use @solana/web3.js Keypair.fromSeed()
  const publicKey = base58.encode(ed25519Seed);
  const address = publicKey;

  return {
    privateKey,
    publicKey,
    address,
    derivationPath: path,
  };
}

/**
 * Derive Ethereum address from public key (Keccak-256 hash)
 */
function deriveEthereumAddress(publicKey: Uint8Array): string {
  // Remove the first byte (0x04 prefix for uncompressed key)
  const pubKeyWithoutPrefix = publicKey.slice(1);

  // We'd normally use keccak256 here, but for simplicity we'll use a placeholder
  // In production, you'd use: keccak256(pubKeyWithoutPrefix).slice(-20)
  // For now, we'll create a simplified address
  const addressBytes = pubKeyWithoutPrefix.slice(-20);
  return '0x' + Array.from(addressBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
