import CryptoJS from 'crypto-js'

/**
 * Encryption utility for sensitive cached data
 * Uses AES encryption with a user-specific key
 */
export class EncryptionService {
  private static instance: EncryptionService
  private encryptionKey: string | null = null

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  /**
   * Initialize encryption with user-specific key
   */
  initialize(userId: string, sessionToken?: string): void {
    // Create a deterministic but secure key based on user ID and session
    const keyMaterial = `${userId}:${sessionToken || 'default'}:${process.env.NEXT_PUBLIC_APP_SECRET || 'fallback'}`
    this.encryptionKey = CryptoJS.SHA256(keyMaterial).toString()
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized')
    }

    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.encryptionKey).toString()
      return encrypted
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized')
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey)
      return decrypted.toString(CryptoJS.enc.Utf8)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Generate checksum for data integrity
   */
  generateChecksum(data: string): string {
    return CryptoJS.SHA256(data).toString()
  }

  /**
   * Verify data integrity
   */
  verifyChecksum(data: string, checksum: string): boolean {
    return this.generateChecksum(data) === checksum
  }

  /**
   * Clear encryption key (for logout)
   */
  clear(): void {
    this.encryptionKey = null
  }

  /**
   * Check if encryption is available
   */
  isInitialized(): boolean {
    return this.encryptionKey !== null
  }
}

// Singleton instance
export const encryptionService = EncryptionService.getInstance()