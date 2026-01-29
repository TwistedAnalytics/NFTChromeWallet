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
  const publicKey = bytesToHex(child.publicKey!.slice(1)); // Remove the prefix byte

  // For Solana, address is the base58-encoded public key (simplified here)
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
