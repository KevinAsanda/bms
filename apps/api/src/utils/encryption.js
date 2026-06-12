// apps/api/src/utils/encryption.js
import crypto from 'crypto';

// Get encryption key from environment variable (32-byte hex)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const KEY = Buffer.from(ENCRYPTION_KEY, 'hex');
const ALG = 'aes-256-gcm';

export function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALG, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Store as: iv:tag:ciphertext (all hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(stored) {
  if (!stored) return null;
  try {
    const parts = stored.split(':');
    if (parts.length !== 3) {
      // Fallback if data is not encrypted (e.g. dev database seed data)
      return stored;
    }
    const [ivHex, tagHex, encHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALG, KEY, iv);
    decipher.setAuthTag(tag);
    return decipher.update(enc) + decipher.final('utf8');
  } catch (err) {
    console.error('Failed to decrypt data, returning raw value:', err);
    return stored;
  }
}
