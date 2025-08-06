/**
 * Encryption/Decryption utilities for MailoReply AI
 * Provides AES-256-GCM encryption for sensitive message content
 */

// Simple AES-256-GCM encryption using Web Crypto API
class EncryptionService {
  private key: CryptoKey | null = null;
  private keyPromise: Promise<CryptoKey> | null = null;

  // Initialize encryption key from user's session
  private async initializeKey(): Promise<CryptoKey> {
    if (this.key) return this.key;
    
    if (this.keyPromise) return this.keyPromise;

    this.keyPromise = this.generateKey();
    this.key = await this.keyPromise;
    return this.key;
  }

  // Generate a new encryption key or derive from user data
  private async generateKey(): Promise<CryptoKey> {
    // In production, this should be derived from user's session/password
    // For now, using a deterministic key based on user session
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('mailoreply-ai-encryption-key-v1'), // In production: use user-specific key
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('mailoreply-salt'), // In production: use random salt per user
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt text data
  async encrypt(plaintext: string): Promise<string> {
    try {
      const key = await this.initializeKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
      const encodedText = new TextEncoder().encode(plaintext);

      const ciphertext = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encodedText
      );

      // Combine IV and ciphertext
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(ciphertext), iv.length);

      // Return base64 encoded result
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  // Decrypt text data
  async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.initializeKey();
      const combined = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));

      // Extract IV and ciphertext
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  // Check if encryption is supported
  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           window.crypto && 
           window.crypto.subtle && 
           typeof window.crypto.subtle.encrypt === 'function';
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

// Helper functions for easier usage
export const encryptMessage = async (message: string): Promise<string> => {
  if (!encryptionService.isSupported()) {
    throw new Error('Encryption not supported in this environment');
  }
  return encryptionService.encrypt(message);
};

export const decryptMessage = async (encryptedMessage: string): Promise<string> => {
  if (!encryptionService.isSupported()) {
    throw new Error('Decryption not supported in this environment');
  }
  return encryptionService.decrypt(encryptedMessage);
};

// Utility to check if a string is encrypted (base64 check)
export const isEncrypted = (text: string): boolean => {
  try {
    // Basic check: encrypted messages are base64 encoded
    return btoa(atob(text)) === text;
  } catch {
    return false;
  }
};

// Format encrypted content for display
export const formatEncryptedDisplay = (encryptedText: string): string => {
  return `🔒 Encrypted (${encryptedText.substring(0, 16)}...)`;
};

// Toggle encryption state management
export interface EncryptionToggleState {
  enabled: boolean;
  supported: boolean;
}

export const getEncryptionToggleState = (): EncryptionToggleState => {
  const supported = encryptionService.isSupported();
  const enabled = localStorage.getItem('mailoreply-encryption-enabled') === 'true';
  
  return {
    enabled: enabled && supported,
    supported
  };
};

export const setEncryptionEnabled = (enabled: boolean): void => {
  localStorage.setItem('mailoreply-encryption-enabled', enabled.toString());
};
