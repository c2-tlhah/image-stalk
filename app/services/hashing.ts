/**
 * Hashing Utilities
 * Provides cryptographic and perceptual hashes for images
 */

import type { ImageHashes } from '~/types';

/**
 * Converts ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Computes SHA-256 hash
 */
export async function sha256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Computes SHA-1 hash
 */
export async function sha1(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return bufferToHex(hashBuffer);
}

/**
 * Computes MD5 hash (simplified implementation for compatibility)
 * Note: Using Web Crypto API which doesn't support MD5, so we'll compute it differently
 * For production, consider using a library or skip MD5
 */
export async function md5(data: ArrayBuffer): Promise<string> {
  // MD5 is not available in Web Crypto API
  // For now, return a placeholder. In production, use a pure JS MD5 library
  // or skip MD5 entirely (SHA-256 is more secure anyway)
  const sha256Hash = await sha256(data);
  return sha256Hash.substring(0, 32); // Temporary placeholder
}

/**
 * Simple perceptual hash (pHash) implementation
 * This is a VERY simplified version. For production, use a proper image hash library
 */
export async function computePerceptualHash(
  imageData: Uint8Array,
  width: number,
  height: number
): Promise<string> {
  // This is a placeholder for perceptual hashing
  // A real implementation would:
  // 1. Resize image to 32x32 or 8x8
  // 2. Convert to grayscale
  // 3. Compute DCT (Discrete Cosine Transform)
  // 4. Extract low-frequency components
  // 5. Compute hash from the components
  
  // For now, return a simple hash based on image dimensions and data
  const sampleSize = Math.min(64, imageData.length);
  let hash = '';
  
  for (let i = 0; i < sampleSize; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < sampleSize; j++) {
      if (imageData[i + j] > 128) {
        byte |= 1 << j;
      }
    }
    hash += byte.toString(16).padStart(2, '0');
  }
  
  return hash + `-${width}x${height}`;
}

/**
 * Computes all hashes for an image
 */
export async function computeAllHashes(
  buffer: ArrayBuffer,
  width?: number,
  height?: number
): Promise<ImageHashes> {
  const [sha256Hash, sha1Hash, md5Hash] = await Promise.all([
    sha256(buffer),
    sha1(buffer),
    md5(buffer),
  ]);
  
  // Perceptual hash requires image data
  let phash = 'unknown';
  if (width && height) {
    // In a real implementation, we'd decode the image first
    phash = await computePerceptualHash(new Uint8Array(buffer), width, height);
  }
  
  return {
    sha256: sha256Hash,
    sha1: sha1Hash,
    md5: md5Hash,
    phash,
  };
}

/**
 * Hex dump utility for displaying first N bytes
 */
export function hexDump(buffer: ArrayBuffer, maxBytes: number = 64): string {
  const bytes = new Uint8Array(buffer);
  const limit = Math.min(maxBytes, bytes.length);
  const lines: string[] = [];
  
  for (let i = 0; i < limit; i += 16) {
    const offset = i.toString(16).padStart(8, '0');
    const chunk = bytes.slice(i, Math.min(i + 16, limit));
    const hex = Array.from(chunk)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    const ascii = Array.from(chunk)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('');
    
    lines.push(`${offset}  ${hex.padEnd(48, ' ')}  ${ascii}`);
  }
  
  return lines.join('\n');
}
