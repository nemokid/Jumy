// Client-side encryption utilities using Web Crypto API
// All encryption happens in the browser - server never sees plaintext

/**
 * Hash a value using SHA-256
 */
export async function hashValue(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive an encryption key from a password/hash using PBKDF2
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text content
 * Returns base64 encoded string with IV prepended
 */
export async function encryptText(plaintext, recipientHash) {
  const key = await deriveKey(recipientHash, 'jumy-salt-v1');
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  
  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt text content
 */
export async function decryptText(encryptedBase64, recipientHash) {
  try {
    const key = await deriveKey(recipientHash, 'jumy-salt-v1');
    const combined = new Uint8Array(
      atob(encryptedBase64).split('').map(c => c.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Decryption failed]';
  }
}

/**
 * Encrypt a file (ArrayBuffer)
 * Returns encrypted ArrayBuffer with IV prepended
 */
export async function encryptFile(fileBuffer, recipientHash) {
  const key = await deriveKey(recipientHash, 'jumy-file-salt-v1');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBuffer
  );
  
  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return combined.buffer;
}

/**
 * Decrypt a file (ArrayBuffer)
 */
export async function decryptFile(encryptedBuffer, recipientHash) {
  try {
    const key = await deriveKey(recipientHash, 'jumy-file-salt-v1');
    const combined = new Uint8Array(encryptedBuffer);
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return decrypted;
  } catch (error) {
    console.error('File decryption failed:', error);
    return null;
  }
}

/**
 * Convert File to ArrayBuffer
 */
export function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert ArrayBuffer to Blob for download
 */
export function arrayBufferToBlob(buffer, mimeType) {
  return new Blob([buffer], { type: mimeType });
}
