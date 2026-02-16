/**
 * Metadata Extraction Service
 * Extracts EXIF, IPTC, XMP, and other metadata from images
 */

import ExifReader from 'exifreader';
import type { ImageMetadata, TimeSignal } from '~/types';

/**
 * Detects file type from magic bytes
 */
export function detectFileType(buffer: ArrayBuffer): { type: string; mime: string } {
  const bytes = new Uint8Array(buffer);
  const header = Array.from(bytes.slice(0, 12))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  
  // JPEG
  if (header.startsWith('ffd8ff')) {
    return { type: 'JPEG', mime: 'image/jpeg' };
  }
  
  // PNG
  if (header.startsWith('89504e470d0a1a0a')) {
    return { type: 'PNG', mime: 'image/png' };
  }
  
  // GIF
  if (header.startsWith('474946383961') || header.startsWith('474946383761')) {
    return { type: 'GIF', mime: 'image/gif' };
  }
  
  // WebP
  if (header.substring(0, 8) === '52494646' && header.substring(16, 24) === '57454250') {
    return { type: 'WebP', mime: 'image/webp' };
  }
  
  // BMP
  if (header.startsWith('424d')) {
    return { type: 'BMP', mime: 'image/bmp' };
  }
  
  // TIFF (little-endian)
  if (header.startsWith('49492a00')) {
    return { type: 'TIFF', mime: 'image/tiff' };
  }
  
  // TIFF (big-endian)
  if (header.startsWith('4d4d002a')) {
    return { type: 'TIFF', mime: 'image/tiff' };
  }
  
  return { type: 'Unknown', mime: 'application/octet-stream' };
}

/**
 * Gets magic bytes as hex string
 */
export function getMagicBytes(buffer: ArrayBuffer, length: number = 12): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes.slice(0, Math.min(length, bytes.length)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ')
    .toUpperCase();
}

/**
 * Extracts basic image dimensions (simplified)
 */
export function extractDimensions(
  buffer: ArrayBuffer,
  fileType: string
): { width: number; height: number } | null {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  
  try {
    switch (fileType) {
      case 'PNG': {
        // PNG: width at byte 16, height at byte 20 (big-endian)
        if (buffer.byteLength >= 24) {
          return {
            width: view.getUint32(16, false),
            height: view.getUint32(20, false),
          };
        }
        break;
      }
      
      case 'GIF': {
        // GIF: width at byte 6, height at byte 8 (little-endian)
        if (buffer.byteLength >= 10) {
          return {
            width: view.getUint16(6, true),
            height: view.getUint16(8, true),
          };
        }
        break;
      }
      
      case 'JPEG': {
        // JPEG is complex, scan for SOF markers
        let offset = 2; // Skip FFD8
        while (offset < bytes.length - 8) {
          if (bytes[offset] !== 0xff) break;
          
          const marker = bytes[offset + 1];
          const length = view.getUint16(offset + 2, false);
          
          // SOF0, SOF1, SOF2
          if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
            return {
              height: view.getUint16(offset + 5, false),
              width: view.getUint16(offset + 7, false),
            };
          }
          
          offset += 2 + length;
        }
        break;
      }
      
      case 'WebP': {
        // WebP is complex, simplified check for VP8/VP8L
        const fourcc = String.fromCharCode(...Array.from(bytes.slice(12, 16)));
        if (fourcc === 'VP8 ' && buffer.byteLength >= 30) {
          const width = view.getUint16(26, true) & 0x3fff;
          const height = view.getUint16(28, true) & 0x3fff;
          return { width, height };
        }
        break;
      }
      
      case 'BMP': {
        // BMP: width at byte 18, height at byte 22 (little-endian)
        if (buffer.byteLength >= 26) {
          return {
            width: view.getUint32(18, true),
            height: Math.abs(view.getInt32(22, true)), // Can be negative
          };
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error extracting dimensions:', error);
  }
  
  return null;
}

/**
 * Checks for sensitive data in metadata
 */
function checkSensitiveData(tags: any): {
  has_gps: boolean;
  has_serial: boolean;
  redacted_fields: string[];
} {
  const redacted: string[] = [];
  let has_gps = false;
  let has_serial = false;
  
  // Check for GPS
  const gpsFields = [
    'GPSLatitude', 'GPSLongitude', 'GPSPosition', 
    'GPSAltitude', 'GPSImgDirection', 'GPSDestLatitude', 
    'GPSDestLongitude', 'GPSDateStamp', 'GPSTimeStamp'
  ];
  
  for (const field of gpsFields) {
    if (tags[field]) {
      has_gps = true;
      redacted.push(field);
    }
  }

  if (has_gps) {
      // Add generic marker to explain why
      // redacted.push('GPS coordinates'); 
  }
  
  // Check for serial numbers
  const serialFields = ['SerialNumber', 'InternalSerialNumber', 'LensSerialNumber'];
  for (const field of serialFields) {
    if (tags[field]) {
      has_serial = true;
      redacted.push(field);
    }
  }
  
  return { has_gps, has_serial, redacted_fields: redacted };
}

/**
 * Creates time signal from EXIF date
 */
function createTimeSignal(
  value: string | null | undefined,
  source: string,
  reliability: string,
  confidence: number
): TimeSignal {
  return {
    iso_value: value || null,
    source,
    reliability_note: reliability,
    confidence_score: confidence,
  };
}

/**
 * Main metadata extraction function
 */
export async function extractMetadata(buffer: ArrayBuffer): Promise<ImageMetadata> {
  const fileInfo = detectFileType(buffer);
  const dimensions = extractDimensions(buffer, fileInfo.type);
  
  let tags: any = {};
  let exif: any = {};
  let iptc: any = {};
  let xmp: any = {};
  
  try {
    // ExifReader.load expects ArrayBuffer
    tags = ExifReader.load(buffer, { expanded: true });
    
    // Extract EXIF, IPTC, XMP with fallbacks
    exif = tags.exif || tags.Exif || {};
    iptc = tags.iptc || tags.IPTC || {};
    xmp = tags.xmp || tags.XMP || {};
    
    // Also check for tags directly on the root object (some formats)
    if (Object.keys(exif).length === 0) {
      // Try to extract common EXIF fields from root
      const commonFields = [
        'Make', 'Model', 'DateTime', 'DateTimeOriginal', 'CreateDate',
        'ModifyDate', 'Software', 'ExposureTime', 'FNumber', 'ISO',
        'FocalLength', 'Flash', 'WhiteBalance', 'ColorSpace'
      ];
      
      for (const field of commonFields) {
        if (tags[field]) {
          exif[field] = tags[field];
        }
      }
    }
  } catch (error) {
    console.warn('ExifReader failed:', error);
    // Continue with empty metadata rather than failing
  }
  
  const sensitive = checkSensitiveData({ ...tags, ...exif });
  
  // Color info
  const colorSpace = exif.ColorSpace?.description || exif.ColorSpace?.value || 'Unknown';
  const bitsPerSample = exif.BitsPerSample?.value?.[0] || exif.BitsPerSample || 8;
  
  const metadata: ImageMetadata = {
    file: {
      type: fileInfo.type,
      mime: fileInfo.mime,
      size: buffer.byteLength,
      magic_bytes: getMagicBytes(buffer),
    },
    dimensions: {
      width: dimensions?.width || 0,
      height: dimensions?.height || 0,
      aspect_ratio: dimensions
        ? `${dimensions.width}:${dimensions.height}`
        : 'Unknown',
    },
    color: {
      model: colorSpace.includes('RGB') ? 'RGB' : colorSpace.includes('YCbCr') ? 'YCbCr' : 'Unknown',
      bit_depth: bitsPerSample,
      has_alpha: fileInfo.type === 'PNG' || fileInfo.type === 'WebP',
      icc_profile: tags.icc ? 'Present' : null,
    },
    exif: sanitizeMetadata(exif, []), // We now send full data to frontend, letting UI handle hiding
    iptc: sanitizeMetadata(iptc, []),
    xmp: sanitizeMetadata(xmp, []),
    sensitive_data: sensitive,
  };
  
  return metadata;
}

/**
 * Sanitizes metadata by removing sensitive fields
 */
function sanitizeMetadata(obj: any, redactedFields: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip if in redacted list (Disabled for now to allow client-side toggling)
    // if (redactedFields.includes(key)) {
    //   result[key] = '[REDACTED]';
    //   continue;
    // }
    
    // Convert ExifReader objects to simple values
    if (value && typeof value === 'object') {
      if ('description' in value) {
        result[key] = value.description;
      } else if ('value' in value) {
        result[key] = value.value;
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Converts EXIF date format to ISO string
 */
function exifDateToISO(exifDate: any): string | null {
  if (!exifDate) return null;
  
  try {
    // Handle different input types
    let dateStr = '';
    
    // Handle ExifReader's complex object structure
    if (typeof exifDate === 'object') {
      if ('description' in exifDate) {
        dateStr = exifDate.description;
      } else if ('value' in exifDate) {
        // value can be string or array of strings
        const val = exifDate.value;
        if (Array.isArray(val) && val.length > 0) {
          dateStr = val[0];
        } else {
          dateStr = String(val);
        }
      } else {
        // Fallback toString if neither description nor value exists
        dateStr = String(exifDate);
      }
    } else if (typeof exifDate === 'string') {
      dateStr = exifDate;
    } else {
      return null;
    }
    
    // Clean up the string
    dateStr = dateStr.trim();
    if (!dateStr) return null;

    // Common EXIF formats:
    // "YYYY:MM:DD HH:MM:SS"
    // "YYYY:MM:DD HH:MM:SS+00:00"
    // "YYYY-MM-DD HH:MM:SS" (non-standard but possible)
    
    // 1. Try "YYYY:MM:DD" format first
    // Replace colons in date part with dashes, and space with T
    // regex: start with 4 digits, colon, 2 digits, colon, 2 digits
    if (/^\d{4}:\d{2}:\d{2}/.test(dateStr)) {
       // "2023:10:27 11:22:33" -> "2023-10-27T11:22:33"
       // The regex /:(\d{2}):(\d{2})/g might match time parts too if not careful
       // Safer: split by space
       const parts = dateStr.split(' ');
       if (parts.length >= 2) {
         const datePart = parts[0].replace(/:/g, '-');
         const timePart = parts[1];
         // Reassemble as ISO-like
         const isoLike = `${datePart}T${timePart}`;
         const date = new Date(isoLike);
         if (!isNaN(date.getTime())) return date.toISOString();
       } else {
         // Maybe just date? "2023:10:27"
         const datePart = dateStr.replace(/:/g, '-');
         const date = new Date(datePart);
         if (!isNaN(date.getTime())) return date.toISOString();
       }
    }
    
    // 2. Try standard Date parsing for other formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
      
  } catch (error) {
    console.warn('Failed to convert EXIF date:', error);
  }
  
  return null;
}

/**
 * Extracts time signals from metadata and headers
 */
export function extractTimeSignals(
  metadata: ImageMetadata,
  headers?: Record<string, string>,
  clientLastModified?: number | null
): {
  exif_capture_time: TimeSignal;
  exif_modify_time: TimeSignal;
  server_last_modified: TimeSignal;
  server_date: TimeSignal;
  first_seen_by_system: TimeSignal;
  client_last_modified: TimeSignal;
} {
  // Try multiple EXIF date fields for capture time
  const captureDate = exifDateToISO(
    metadata.exif.DateTimeOriginal || 
    metadata.exif.CreateDate || 
    metadata.exif['Date/Time Original']
  );
  
  // Try multiple EXIF date fields for modify time
  const modifyDate = exifDateToISO(
    metadata.exif.ModifyDate || 
    metadata.exif.DateTime || 
    metadata.exif['Date/Time']
  );
  
  return {
    exif_capture_time: createTimeSignal(
      captureDate,
      'EXIF DateTimeOriginal',
      'Camera capture time (user-editable)',
      captureDate ? 60 : 0
    ),
    exif_modify_time: createTimeSignal(
      modifyDate,
      'EXIF ModifyDate',
      'File modification time per EXIF (user-editable)',
      modifyDate ? 50 : 0
    ),
    server_last_modified: createTimeSignal(
      headers?.['last-modified'] || null,
      'HTTP Last-Modified header',
      'Server file modification time (may not equal upload time)',
      headers?.['last-modified'] ? 70 : 0
    ),
    server_date: createTimeSignal(
      headers?.date || null,
      'HTTP Date header',
      'Server response time',
      headers?.date ? 80 : 0
    ),
    client_last_modified: createTimeSignal(
      clientLastModified ? new Date(clientLastModified).toISOString() : null,
      'Client Modified Time',
      'File last modified time on user device',
      clientLastModified ? 90 : 0
    ),
    first_seen_by_system: createTimeSignal(
      new Date().toISOString(),
      'System analysis time',
      'First time analyzed by our system',
      100
    ),
  };
}
