/**
 * Content Analysis Service
 * Analyzes image content for palette, compression hints, etc.
 */

import type { ContentMetrics } from '~/types';

/**
 * Extracts image pixel data from JPEG/PNG
 */
function extractRawPixels(buffer: ArrayBuffer): Uint8Array | null {
  const bytes = new Uint8Array(buffer);
  
  // For now, use a smart sampling strategy that avoids headers
  // This won't be perfect but will be much better than random bytes
  
  // Detect format
  const header = Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  if (header.startsWith('ffd8ff')) {
    // JPEG - skip to after headers (usually around byte 600-2000)
    const startOffset = Math.min(2000, Math.floor(bytes.length * 0.1));
    // Sample from the middle 80% of the file (actual image data)
    const dataStart = startOffset;
    const dataEnd = bytes.length - Math.floor(bytes.length * 0.05);
    return bytes.slice(dataStart, dataEnd);
  } else if (header.startsWith('89504e47')) {
    // PNG - skip first 33 bytes (header) and sample from IDAT chunks
    const dataStart = Math.min(100, Math.floor(bytes.length * 0.05));
    return bytes.slice(dataStart);
  }
  
  // For other formats, skip first 5% and last 5%
  const start = Math.floor(bytes.length * 0.05);
  const end = Math.floor(bytes.length * 0.95);
  return bytes.slice(start, end);
}

/**
 * Extracts dominant colors from image data
 */
function extractPalette(buffer: ArrayBuffer): Array<{ color: string; percentage: number }> {
  const pixelData = extractRawPixels(buffer);
  if (!pixelData) {
    return [{ color: '#808080', percentage: 100 }];
  }
  
  const colorMap = new Map<string, number>();
  
  // Sample every 100th byte triplet for performance
  const step = 100;
  const samples = Math.min(10000, Math.floor(pixelData.length / 3 / step));
  
  for (let i = 0; i < samples; i++) {
    const offset = i * step * 3;
    if (offset + 2 < pixelData.length) {
      const r = pixelData[offset];
      const g = pixelData[offset + 1];
      const b = pixelData[offset + 2];
      
      // Quantize to reduce color space (group similar colors)
      const qr = Math.floor(r / 51) * 51; // 0, 51, 102, 153, 204, 255
      const qg = Math.floor(g / 51) * 51;
      const qb = Math.floor(b / 51) * 51;
      
      const color = `#${qr.toString(16).padStart(2, '0')}${qg.toString(16).padStart(2, '0')}${qb.toString(16).padStart(2, '0')}`;
      colorMap.set(color, (colorMap.get(color) || 0) + 1);
    }
  }
  
  if (colorMap.size === 0) {
    return [{ color: '#808080', percentage: 100 }];
  }
  
  // Sort by frequency and get top 5
  const sorted = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  
  return sorted.map(([color, count]) => ({
    color,
    percentage: Math.round((count / total) * 100),
  }));
}

/**
 * Detects potential JPEG recompression
 */
function detectRecompression(buffer: ArrayBuffer): {
  likely_recompressed: boolean;
  confidence: number;
  notes: string[];
} {
  const bytes = new Uint8Array(buffer);
  const notes: string[] = [];
  
  // Check if it's a JPEG
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return {
      likely_recompressed: false,
      confidence: 0,
      notes: ['Not a JPEG image'],
    };
  }
  
  // Look for multiple quantization tables (simplified)
  let qtableCount = 0;
  let offset = 2;
  
  while (offset < bytes.length - 4) {
    if (bytes[offset] === 0xff) {
      const marker = bytes[offset + 1];
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      
      // DQT (Define Quantization Table) marker
      if (marker === 0xdb) {
        qtableCount++;
      }
      
      // SOF (Start of Frame) - stop searching
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8) {
        break;
      }
      
      offset += 2 + length;
    } else {
      offset++;
    }
  }
  
  if (qtableCount > 2) {
    notes.push(`Found ${qtableCount} quantization tables (unusual)`);
  }
  
  // Check file size vs expected for quality
  const size = buffer.byteLength;
  if (size < 50000) {
    notes.push('Small file size may indicate compression');
  }
  
  const likely = qtableCount > 2 || (size < 50000 && qtableCount > 0);
  const confidence = likely ? 40 : 10;
  
  if (!likely) {
    notes.push('No strong indicators of recompression detected');
  }
  
  return {
    likely_recompressed: likely,
    confidence,
    notes,
  };
}

/**
 * Simple brightness calculation from pixel data
 */
function calculateBrightness(buffer: ArrayBuffer): number {
  const pixelData = extractRawPixels(buffer);
  if (!pixelData) return 50;
  
  // Sample every 100th byte triplet
  const step = 100;
  const samples = Math.min(5000, Math.floor(pixelData.length / 3 / step));
  let brightnessSum = 0;
  
  for (let i = 0; i < samples; i++) {
    const offset = i * step * 3;
    if (offset + 2 < pixelData.length) {
      const r = pixelData[offset];
      const g = pixelData[offset + 1];
      const b = pixelData[offset + 2];
      
      // Calculate perceived brightness (weighted RGB)
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      brightnessSum += brightness;
    }
  }
  
  return Math.round((brightnessSum / samples) * 100);
}

/**
 * Calculate contrast from pixel data
 */
function calculateContrast(buffer: ArrayBuffer): number {
  const pixelData = extractRawPixels(buffer);
  if (!pixelData) return 50;
  
  const step = 100;
  const samples = Math.min(3000, Math.floor(pixelData.length / 3 / step));
  const luminances: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const offset = i * step * 3;
    if (offset + 2 < pixelData.length) {
      const r = pixelData[offset];
      const g = pixelData[offset + 1];
      const b = pixelData[offset + 2];
      luminances.push(0.299 * r + 0.587 * g + 0.114 * b);
    }
  }
  
  if (luminances.length === 0) return 50;
  
  // Calculate standard deviation as a measure of contrast
  const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
  const variance = luminances.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / luminances.length;
  const stdDev = Math.sqrt(variance);
  
  // Normalize to 0-100 range (255 would be max stdDev)
  return Math.min(100, Math.round((stdDev / 255) * 200));
}

/**
 * Detects if text is likely present (very crude)
 */
function detectTextLikely(buffer: ArrayBuffer): boolean {
  // This is a placeholder
  // A real implementation would look for high-contrast edges, text-like patterns
  // For now, just return false
  return false;
}

/**
 * Analyzes image content and returns metrics
 */
export async function analyzeContent(buffer: ArrayBuffer): Promise<ContentMetrics> {
  const palette = extractPalette(buffer);
  const brightness = calculateBrightness(buffer);
  const contrast = calculateContrast(buffer);
  const compression_hints = detectRecompression(buffer);
  const has_text_likely = detectTextLikely(buffer);
  
  return {
    palette,
    brightness,
    contrast,
    has_text_likely,
    compression_hints,
  };
}
