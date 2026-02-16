/**
 * SSRF Protection Module
 * Blocks access to private IPs, localhost, and other dangerous targets
 */

// Private IP ranges (RFC 1918, RFC 4193, etc.)
const BLOCKED_IP_PATTERNS = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private Class B
  /^192\.168\./,               // Private Class C
  /^169\.254\./,               // Link-local
  /^::1$/,                     // IPv6 loopback
  /^fe80:/,                    // IPv6 link-local
  /^fc00:/,                    // IPv6 private
  /^fd00:/,                    // IPv6 private
  /^0\.0\.0\.0$/,              // Invalid
  /^255\.255\.255\.255$/,      // Broadcast
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  'metadata.google.internal', // GCP metadata
  '169.254.169.254',          // AWS/Azure metadata
];

export class SSRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSRFError';
  }
}

/**
 * Validates URL structure and protocol
 */
export function validateUrlStructure(url: string): URL {
  let parsedUrl: URL;
  
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new SSRFError('Invalid URL format');
  }
  
  // Only allow http/https
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new SSRFError(`Protocol ${parsedUrl.protocol} is not allowed`);
  }
  
  // Block file://, ftp://, etc.
  if (parsedUrl.protocol === 'file:') {
    throw new SSRFError('File protocol is not allowed');
  }
  
  return parsedUrl;
}

/**
 * Checks if hostname is blocked
 */
export function isHostnameBlocked(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  
  // Check exact matches
  if (BLOCKED_HOSTNAMES.includes(lower)) {
    return true;
  }
  
  // Check IP patterns
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(lower)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validates that the target URL is safe to fetch
 */
export function validateSafeUrl(url: string): { valid: boolean; url: URL; error?: string } {
  try {
    const parsedUrl = validateUrlStructure(url);
    
    // Check hostname
    if (isHostnameBlocked(parsedUrl.hostname)) {
      return {
        valid: false,
        url: parsedUrl,
        error: `Hostname ${parsedUrl.hostname} is blocked (private/internal)`,
      };
    }
    
    // Additional checks for credentials in URL
    if (parsedUrl.username || parsedUrl.password) {
      return {
        valid: false,
        url: parsedUrl,
        error: 'URLs with embedded credentials are not allowed',
      };
    }
    
    return { valid: true, url: parsedUrl };
  } catch (error) {
    return {
      valid: false,
      url: new URL('http://invalid'),
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Checks response for redirects to dangerous locations
 */
export function validateRedirectUrl(url: string): boolean {
  const validation = validateSafeUrl(url);
  return validation.valid;
}
