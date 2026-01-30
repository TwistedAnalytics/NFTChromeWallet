import { randomBytes, bytesToBase64, base64ToBytes } from '@nft-wallet/shared';

/**
 * PBKDF2 iterations (OWASP 2023 recommendation)
 */
const PBKDF2_ITERATIONS = 600000;

/**
 * AES-GCM parameters
 */
const AES_KEY_LENGTH = 256;
const AES_IV_LENGTH = 12;

/**
 * Derive encryption key from password using PBKDF2
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,  // FIX: Cast to ArrayBuffer
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encrypt(data: string, password: string): Promise<{ encrypted: string; salt: string }> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Generate random salt and IV
  const salt = randomBytes(32);
  const iv = randomBytes(AES_IV_LENGTH);

  // Derive key from password
  const key = await deriveKey(password, salt);

  // Encrypt data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,  // FIX: Cast to ArrayBuffer
    },
    key,
    dataBuffer
  );

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return {
    encrypted: bytesToBase64(combined),
    salt: bytesToBase64(salt),
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decrypt(encrypted: string, salt: string, password: string): Promise<string> {
  const combined = base64ToBytes(encrypted);
  const saltBytes = base64ToBytes(salt);

  // Extract IV and encrypted data
  const iv = combined.slice(0, AES_IV_LENGTH);
  const encryptedData = combined.slice(AES_IV_LENGTH);

  // Derive key from password
  const key = await deriveKey(password, saltBytes);

  try {
    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer as ArrayBuffer,  // FIX: Cast to ArrayBuffer
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Decryption failed: invalid password or corrupted data');
  }
}

/**
 * Hash password for verification (not used for encryption)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bytesToBase64(new Uint8Array(hashBuffer));
}
