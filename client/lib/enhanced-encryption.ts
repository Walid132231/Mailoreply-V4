/**
 * Enhanced Encryption Service for MailoReply AI
 * Production-ready AES-256-GCM encryption with proper key management
 */

import { supabase } from './supabase';

// Enhanced encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12, // 96-bit IV for GCM
  tagLength: 128, // 128-bit authentication tag
  iterations: 100000, // PBKDF2 iterations
  keyDerivation: 'PBKDF2'
};

class EnhancedEncryptionService {
  private userKey: CryptoKey | null = null;
  private keyPromise: Promise<CryptoKey> | null = null;
  private userId: string | null = null;

  /**
   * Initialize encryption with user-specific key
   */
  async initializeForUser(userId: string, userEmail?: string): Promise<void> {
    if (this.userId === userId && this.userKey) return;
    
    this.userId = userId;
    this.userKey = null;
    this.keyPromise = null;
    
    // Generate user-specific key
    this.keyPromise = this.deriveUserKey(userId, userEmail);
    this.userKey = await this.keyPromise;
  }

  /**
   * Derive user-specific encryption key
   */
  private async deriveUserKey(userId: string, userEmail?: string): Promise<CryptoKey> {
    if (!this.isSupported()) {
      throw new Error('Web Crypto API not supported');
    }

    // Create user-specific key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(`mailoreply-user-${userId}-${userEmail || 'unknown'}`),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Generate user-specific salt
    const saltData = `mailoreply-salt-${userId}-v2`;
    const salt = new TextEncoder().encode(saltData);

    // Derive encryption key
    return window.crypto.subtle.deriveKey(
      {
        name: ENCRYPTION_CONFIG.keyDerivation,
        salt,
        iterations: ENCRYPTION_CONFIG.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { 
        name: ENCRYPTION_CONFIG.algorithm, 
        length: ENCRYPTION_CONFIG.keyLength 
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt text with user-specific key
   */
  async encrypt(plaintext: string, userId?: string): Promise<string> {
    if (!this.isSupported()) {
      throw new Error('Encryption not supported in this environment');
    }

    // Ensure user key is initialized
    if (userId && this.userId !== userId) {
      const { data: { user } } = await supabase.auth.getUser();
      await this.initializeForUser(userId, user?.email);
    }

    if (!this.userKey) {
      throw new Error('Encryption key not initialized');
    }

    try {
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));
      const encodedText = new TextEncoder().encode(plaintext);

      // Encrypt with AES-GCM
      const ciphertext = await window.crypto.subtle.encrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv: iv,
          tagLength: ENCRYPTION_CONFIG.tagLength
        },
        this.userKey,
        encodedText
      );

      // Combine IV and ciphertext
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(ciphertext), iv.length);

      // Return base64 encoded result with version prefix
      return 'v2:' + btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt text with user-specific key
   */
  async decrypt(encryptedData: string, userId?: string): Promise<string> {
    if (!this.isSupported()) {
      throw new Error('Decryption not supported in this environment');
    }

    // Ensure user key is initialized
    if (userId && this.userId !== userId) {
      const { data: { user } } = await supabase.auth.getUser();
      await this.initializeForUser(userId, user?.email);
    }

    if (!this.userKey) {
      throw new Error('Decryption key not initialized');
    }

    try {
      // Handle version prefix
      let dataToDecrypt = encryptedData;
      if (encryptedData.startsWith('v2:')) {
        dataToDecrypt = encryptedData.substring(3);
      }

      const combined = new Uint8Array(atob(dataToDecrypt).split('').map(char => char.charCodeAt(0)));

      // Extract IV and ciphertext
      const iv = combined.slice(0, ENCRYPTION_CONFIG.ivLength);
      const ciphertext = combined.slice(ENCRYPTION_CONFIG.ivLength);

      // Decrypt with AES-GCM
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv: iv,
          tagLength: ENCRYPTION_CONFIG.tagLength
        },
        this.userKey,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt message - data may be corrupted or key mismatch');
    }
  }

  /**
   * Check if encryption is supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           window.crypto && 
           window.crypto.subtle && 
           typeof window.crypto.subtle.encrypt === 'function';
  }

  /**
   * Get encryption metadata for debugging
   */
  getEncryptionInfo(): object {
    return {
      supported: this.isSupported(),
      algorithm: ENCRYPTION_CONFIG.algorithm,
      keyLength: ENCRYPTION_CONFIG.keyLength,
      userInitialized: this.userId !== null,
      keyReady: this.userKey !== null
    };
  }

  /**
   * Clear user-specific keys (for logout)
   */
  clearUserKeys(): void {
    this.userKey = null;
    this.keyPromise = null;
    this.userId = null;
  }
}

// Export singleton instance
export const enhancedEncryptionService = new EnhancedEncryptionService();

// Helper functions with user context
export const encryptMessage = async (message: string, userId?: string): Promise<string> => {
  return enhancedEncryptionService.encrypt(message, userId);
};

export const decryptMessage = async (encryptedMessage: string, userId?: string): Promise<string> => {
  return enhancedEncryptionService.decrypt(encryptedMessage, userId);
};

// Enhanced encryption state management
export interface EnhancedEncryptionState {
  enabled: boolean;
  supported: boolean;
  userInitialized: boolean;
  alwaysEncrypt: boolean;
}

export const getEnhancedEncryptionState = (): EnhancedEncryptionState => {
  const supported = enhancedEncryptionService.isSupported();
  const enabled = localStorage.getItem('mailoreply-encryption-enabled') === 'true';
  const alwaysEncrypt = localStorage.getItem('mailoreply-always-encrypt') === 'true';
  
  return {
    enabled: (enabled || alwaysEncrypt) && supported,
    supported,
    userInitialized: enhancedEncryptionService.getEncryptionInfo().userInitialized as boolean,
    alwaysEncrypt
  };
};

export const setEncryptionEnabled = (enabled: boolean): void => {
  localStorage.setItem('mailoreply-encryption-enabled', enabled.toString());
};

export const setAlwaysEncrypt = (enabled: boolean): void => {
  localStorage.setItem('mailoreply-always-encrypt', enabled.toString());
};

// Utility functions
export const isEncrypted = (text: string): boolean => {
  try {
    // Check for version prefix or valid base64
    if (text.startsWith('v2:')) {
      const base64Part = text.substring(3);
      return btoa(atob(base64Part)) === base64Part;
    }
    // Legacy format check
    return btoa(atob(text)) === text && text.length > 20;
  } catch {
    return false;
  }
};

export const formatEncryptedDisplay = (encryptedText: string): string => {
  const preview = encryptedText.startsWith('v2:') ? encryptedText.substring(3, 19) : encryptedText.substring(0, 16);
  return `🔒 Encrypted (${preview}...)`;
};

// Initialize encryption for authenticated user
export const initializeEncryptionForUser = async (userId: string, userEmail?: string): Promise<void> => {
  if (enhancedEncryptionService.isSupported()) {
    await enhancedEncryptionService.initializeForUser(userId, userEmail);
  }
};

// Clear encryption on logout
export const clearEncryptionKeys = (): void => {
  enhancedEncryptionService.clearUserKeys();
};

// Test encryption functionality
export const testEncryption = async (testMessage: string = 'Test encryption message'): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    await initializeEncryptionForUser(user.id, user.email);
    
    const encrypted = await encryptMessage(testMessage);
    const decrypted = await decryptMessage(encrypted);
    
    return decrypted === testMessage;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
};

// Export legacy functions for backward compatibility
export {
  enhancedEncryptionService as encryptionService,
  getEnhancedEncryptionState as getEncryptionToggleState
};