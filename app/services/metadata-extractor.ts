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
export async function extractMetadata(buffer: ArrayBuffer, clientExif?: any): Promise<ImageMetadata> {
  const fileInfo = detectFileType(buffer);
  const dimensions = extractDimensions(buffer, fileInfo.type);
  
  let tags: any = {};
  let exif: any = {};
  let iptc: any = {};
  let xmp: any = {};
  let gps: any = {};
  
  // If client provided EXIF (from mobile upload), use it as primary source
  if (clientExif && Object.keys(clientExif).length > 0) {
    console.log('✅ Using client-side EXIF data (mobile upload):', Object.keys(clientExif).length, 'groups');
    tags = clientExif;
    exif = clientExif.exif || clientExif.Exif || {};
    iptc = clientExif.iptc || clientExif.IPTC || {};
    xmp = clientExif.xmp || clientExif.XMP || {};
    gps = clientExif.gps || clientExif.GPS || {};
    
    if (Object.keys(gps).length > 0) {
      console.log('✅ Client GPS data found:', Object.keys(gps).length, 'fields');
    } else {
      console.log('⚠️ No GPS data in client EXIF');
    }
  } else {
    console.log('⚠️ No client EXIF provided, will use server extraction');
  }
  
  try {
    // ExifReader.load expects ArrayBuffer
    const serverTags = ExifReader.load(buffer, { expanded: true });
    
    // If we don't have client EXIF, use server-extracted data
    if (!clientExif || Object.keys(clientExif).length === 0) {
      tags = serverTags;
      exif = serverTags.exif || {};
      iptc = serverTags.iptc || {};
      xmp = serverTags.xmp || {};
      gps = serverTags.gps || {};
      console.log('📊 Server extraction:', Object.keys(exif).length, 'EXIF fields,', Object.keys(gps).length, 'GPS fields');
    } else {
      // Merge server tags with client tags (client takes priority)
      // This handles cases where mobile strips some fields but not all
      const serverExif = serverTags.exif || {};
      const serverGps = serverTags.gps || {};
      
      // Merge, but prioritize client data for GPS fields
      exif = { ...serverExif, ...exif };
      gps = { ...serverGps, ...gps };
    }
    
    // Merge GPS data into exif for unified display
    if (gps && Object.keys(gps).length > 0) {
      exif = { ...exif, ...gps };
    }
    
    // Check for latitude/longitude in XMP or IPTC if missing in EXIF
    if (!exif.GPSLatitude && !exif.GPSLongitude) {
      if (xmp && (xmp.GPSLatitude || xmp.GPSLongitude)) {
        exif.GPSLatitude = xmp.GPSLatitude;
        exif.GPSLongitude = xmp.GPSLongitude;
        if (xmp.GPSAltitude) exif.GPSAltitude = xmp.GPSAltitude;
      }
      // Also check standard XMP exif namespace (often exif:GPSLatitude)
      if (xmp && (xmp['exif:GPSLatitude'] || xmp['exif:GPSLongitude'])) {
         exif.GPSLatitude = xmp['exif:GPSLatitude'];
         exif.GPSLongitude = xmp['exif:GPSLongitude'];
         if (xmp['exif:GPSAltitude']) exif.GPSAltitude = xmp['exif:GPSAltitude'];
      }
    }
    
    // Also check for tags directly on the root object (some formats)
    if (Object.keys(exif).length === 0) {
      // Try to extract common EXIF fields from root
      const commonFields = [
        'Make', 'Model', 'DateTime', 'DateTimeOriginal', 'CreateDate',
        'ModifyDate', 'Software', 'ExposureTime', 'FNumber', 'ISO',
        'FocalLength', 'Flash', 'WhiteBalance', 'ColorSpace',
        'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSPosition'
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
  
  const sensitive = checkSensitiveData({ ...tags, ...exif, ...gps });
  
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
    
    // Direct handling for GPS keys - bypass generic logic entirely
    if (key.includes('GPS')) {
      const gpsVal = formatGPSValue(key, value);
      if (gpsVal !== 'N/A') {
        result[key] = gpsVal;
      }
      continue;
    }
    
    // Convert ExifReader objects to simple values
    if (value && typeof value === 'object') {
      if ('description' in value) {
        // Prefer description (human-readable format)
        const desc = value.description;
        // Check if description is valid
        if (desc && String(desc).toLowerCase() !== 'nan' && String(desc).toLowerCase() !== 'null' && String(desc) !== 'undefined') {
          result[key] = String(desc);
        } else if ('value' in value) {
          // Fallback to value if description is invalid
          result[key] = formatValue(value.value);
        } else {
          result[key] = 'N/A';
        }
      } else if ('value' in value) {
        result[key] = formatValue(value.value);
      } else if (Array.isArray(value)) {
        // Direct array (not wrapped in object)
        result[key] = formatValue(value);
      } else {
        // Other object types - try to stringify
        try {
          const jsonStr = JSON.stringify(value);
          result[key] = jsonStr !== '{}' ? jsonStr : 'N/A';
        } catch {
          result[key] = String(value);
        }
      }
    } else if (value !== null && value !== undefined) {
      // Check for NaN in primitive values
      if (typeof value === 'number' && isNaN(value)) {
        result[key] = 'N/A';
      } else if (String(value).toLowerCase() === 'nan') {
        result[key] = 'N/A';
      } else {
        result[key] = value;
      }
    } else {
      result[key] = 'N/A';
    }
  }
  
  return result;
}

/**
 * Special handler for GPS values with robust extraction
 */
function formatGPSValue(key: string, value: any): string {
  if (!value) return 'N/A';

  try {
    let rawValue = value;
    
    // Unwrap object structure first
    if (value && typeof value === 'object') {
      // Prioritize description if it looks valid
      if ('description' in value) {
        const desc = String(value.description);
        // Check for invalid description values
        const invalidValues = ['nan', 'nu', 'undefined', 'null', 'unknown'];
        if (desc && 
            !invalidValues.includes(desc.toLowerCase()) &&
            !desc.includes('NaN') && 
            desc.trim().length > 0) {
          
          // Check for "0 deg 0' 0.00" pattern in description
          if (/^0\s*deg\s*0'\s*0(\.0+)?/.test(desc)) return 'N/A';
          
          return desc;
        }
      }
      
      if ('value' in value) {
        rawValue = value.value;
      }
    }
    
    // Explicitly handle "NaN" string
    const strVal = String(rawValue).toLowerCase();
    if (strVal === 'nan' || strVal === 'null' || strVal === 'undefined') return 'N/A';

    // Handle "0, 0" or "0, 0, 0" string patterns (common in mobile uploads)
    if (/^0(,\s*0)*$/.test(String(rawValue))) return 'N/A';

    // Handle array format (e.g. [deg, min, sec] or version bytes)
    if (Array.isArray(rawValue)) {
      // Recursive flatten
      const flat = rawValue.flat(Infinity);
      
      // Filter strictly invalid numbers (NaN)
      const numbers = flat.map(v => parseFloat(String(v)));
      
      // Check if ALL checkable values are zero
      // Calculate sum of absolute values to detect [0, 0, 0]
      const sum = numbers.reduce((acc, curr) => acc + (isNaN(curr) ? 0 : Math.abs(curr)), 0);
      
      // If sum is effectively zero, it's invalid GPS data
      if (sum < 0.0001) return 'N/A';

      // Special handling for Latitude/Longitude
      if (flat.length >= 3 && (key.includes('Latitude') || key.includes('Longitude'))) {
        const degrees = numbers[0];
        const minutes = numbers[1];
        const seconds = numbers[2];
        
        if (isNaN(degrees) || isNaN(minutes) || isNaN(seconds)) return 'N/A';
        
        return `${degrees}° ${minutes}' ${seconds.toFixed(4)}"`;
      }
      
      // For TimeStamp, joining with colons looks better if length is 3
      if (key.includes('TimeStamp') && flat.length === 3) {
        return flat.join(':');
      }

      // Default join
      return flat.join(', ');
    }
    
    // Handle single numeric value
    if (typeof rawValue === 'number') {
      if (isNaN(rawValue) || Math.abs(rawValue) < 0.0001) {
        return 'N/A';
      }
      return String(rawValue);
    }
    
    return String(rawValue);
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Helper to format values (arrays, numbers, etc.)
 */
function formatValue(val: any): string {
  if (val === null || val === undefined) {
    return 'N/A';
  }
  
  if (Array.isArray(val)) {
    // Filter out NaN values from array
    const validValues = val.filter(v => {
      if (v === null || v === undefined) {
        return false;
      }
      if (typeof v === 'number' && isNaN(v)) {
        return false;
      }
      if (String(v).toLowerCase() === 'nan') {
        return false;
      }
      return true;
    });
    
    if (validValues.length === 0) {
      return 'N/A';
    } else if (validValues.length === 1) {
      const strValue = String(validValues[0]);
      return strValue.toLowerCase() === 'nan' ? 'N/A' : strValue;
    } else {
      return validValues.map(v => {
        const strValue = String(v);
        return strValue.toLowerCase() === 'nan' ? 'N/A' : strValue;
      }).join(', ');
    }
  }
  
  if (typeof val === 'number' && isNaN(val)) {
    return 'N/A';
  }
  
  const strValue = String(val);
  if (strValue.toLowerCase() === 'nan' || strValue === 'null' || strValue === 'undefined') {
    return 'N/A';
  }
  
  return strValue;
}

/**
 * Helper to convert Date to local ISO string (without Z suffix)
 * This preserves the local time instead of converting to UTC
 */
function dateToLocalISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Converts EXIF date format to ISO string (preserving local time, no UTC conversion)
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
    
    // IMPORTANT: EXIF dates are in LOCAL TIME (camera time), not UTC
    // We must NOT convert to UTC - just reformat as ISO while preserving the time
    
    // 1. Try "YYYY:MM:DD HH:MM:SS" format first
    if (/^\d{4}:\d{2}:\d{2}/.test(dateStr)) {
       const parts = dateStr.split(' ');
       if (parts.length >= 2) {
         const datePart = parts[0].replace(/:/g, '-'); // "2024:02:16" -> "2024-02-16"
         const timePart = parts[1].split('+')[0].split('-')[0]; // Remove timezone if present
         // Return as local time ISO format (no Z, no timezone offset)
         return `${datePart}T${timePart}`;
       } else {
         // Maybe just date? "2023:10:27"
         const datePart = dateStr.replace(/:/g, '-');
         return `${datePart}T00:00:00`;
       }
    }
    
    // 2. Try parsing with Date if it's another format
    // But we need to avoid UTC conversion
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      // Extract local components to avoid UTC conversion
      return dateToLocalISO(date);
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
  // Some cameras (like MediaTek) use standard DateTime for capture if DateTimeOriginal is missing
  const captureDate = exifDateToISO(
    metadata.exif.DateTimeOriginal || 
    metadata.exif['Date/Time Original'] ||
    metadata.exif.CreateDate
  );
  
  // Try multiple EXIF date fields for modify time
  // Note: Standard EXIF defines DateTime as modification time, but users often see it as "the date"
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
      captureDate ? 100 : 0
    ),
    exif_modify_time: createTimeSignal(
      modifyDate,
      'EXIF DateTime', // Changed label to match user request seeing "DateTime"
      'File modification time per EXIF (user-editable)',
      modifyDate ? 100 : 0 // User wants this confident
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
      clientLastModified ? dateToLocalISO(new Date(clientLastModified)) : null,
      'Client Modified Time',
      'File last modified time on user device',
      clientLastModified ? 90 : 0
    ),
    first_seen_by_system: createTimeSignal(
      dateToLocalISO(new Date()),
      'System analysis time',
      'First time analyzed by our system',
      100
    ),
  };
}
