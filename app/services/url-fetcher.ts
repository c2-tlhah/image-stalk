/**
 * Safe URL Fetcher with SSRF protection and size limits
 */

import { validateSafeUrl, validateRedirectUrl, SSRFError } from './ssrf-protection';

export interface FetchResult {
  success: boolean;
  buffer?: ArrayBuffer;
  headers: Record<string, string>;
  finalUrl: string;
  redirectChain: string[];
  status: number;
  error?: string;
}

export interface FetchOptions {
  maxSizeMB: number;
  timeoutMs: number;
  maxRedirects?: number;
}

/**
 * Safely fetches an image URL with protections
 */
export async function fetchSafeUrl(
  url: string,
  options: FetchOptions
): Promise<FetchResult> {
  const { maxSizeMB, timeoutMs, maxRedirects = 5 } = options;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // Initial validation
  const validation = validateSafeUrl(url);
  if (!validation.valid) {
    return {
      success: false,
      headers: {},
      finalUrl: url,
      redirectChain: [url],
      status: 0,
      error: validation.error || 'URL validation failed',
    };
  }
  
  let currentUrl = url;
  const redirectChain: string[] = [url];
  let redirectCount = 0;
  
  try {
    // HEAD request first to check Content-Type and Content-Length
    const headController = new AbortController();
    const headTimeout = setTimeout(() => headController.abort(), timeoutMs);
    
    // Browser-like headers to support Instagram, Facebook, etc.
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site',
    };
    
    let headResponse: Response;
    try {
      headResponse = await fetch(currentUrl, {
        method: 'HEAD',
        headers,
        signal: headController.signal,
        redirect: 'manual', // Handle redirects manually for SSRF checks
      });
    } finally {
      clearTimeout(headTimeout);
    }
    
    // Handle redirects
    while (
      (headResponse.status === 301 ||
        headResponse.status === 302 ||
        headResponse.status === 303 ||
        headResponse.status === 307 ||
        headResponse.status === 308) &&
      redirectCount < maxRedirects
    ) {
      const location = headResponse.headers.get('location');
      if (!location) {
        return {
          success: false,
          headers: Object.fromEntries(headResponse.headers.entries()),
          finalUrl: currentUrl,
          redirectChain,
          status: headResponse.status,
          error: 'Redirect response missing Location header',
        };
      }
      
      // Resolve relative URLs
      const nextUrl = new URL(location, currentUrl).toString();
      
      // Validate redirect target
      if (!validateRedirectUrl(nextUrl)) {
        return {
          success: false,
          headers: Object.fromEntries(headResponse.headers.entries()),
          finalUrl: currentUrl,
          redirectChain,
          status: headResponse.status,
          error: `Redirect to blocked URL: ${nextUrl}`,
        };
      }
      
      currentUrl = nextUrl;
      redirectChain.push(currentUrl);
      redirectCount++;
      
      // Fetch new HEAD
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        headResponse = await fetch(currentUrl, {
          method: 'HEAD',
          headers,
          signal: controller.signal,
          redirect: 'manual',
        });
      } finally {
        clearTimeout(timeout);
      }
    }
    
    if (redirectCount >= maxRedirects) {
      return {
        success: false,
        headers: Object.fromEntries(headResponse.headers.entries()),
        finalUrl: currentUrl,
        redirectChain,
        status: headResponse.status,
        error: 'Too many redirects',
      };
    }
    
    // Check Content-Type
    const contentType = headResponse.headers.get('content-type') || '';
    // Some CDNs don't return proper Content-Type on HEAD requests, so we'll be lenient
    if (contentType && !contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
      return {
        success: false,
        headers: Object.fromEntries(headResponse.headers.entries()),
        finalUrl: currentUrl,
        redirectChain,
        status: headResponse.status,
        error: `Invalid content type: ${contentType} (expected image/*)`,
      };
    }
    
    // Check Content-Length
    const contentLength = headResponse.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      return {
        success: false,
        headers: Object.fromEntries(headResponse.headers.entries()),
        finalUrl: currentUrl,
        redirectChain,
        status: headResponse.status,
        error: `File too large: ${contentLength} bytes (max ${maxSizeBytes})`,
      };
    }
    
    // Now do the actual GET request
    const getController = new AbortController();
    const getTimeout = setTimeout(() => getController.abort(), timeoutMs);
    
    let getResponse: Response;
    try {
      getResponse = await fetch(currentUrl, {
        method: 'GET',
        headers,
        signal: getController.signal,
        redirect: 'follow', // We already validated redirects
      });
    } finally {
      clearTimeout(getTimeout);
    }
    
    if (!getResponse.ok) {
      return {
        success: false,
        headers: Object.fromEntries(getResponse.headers.entries()),
        finalUrl: currentUrl,
        redirectChain,
        status: getResponse.status,
        error: `HTTP ${getResponse.status}: ${getResponse.statusText}`,
      };
    }
    
    // Stream and check size
    const reader = getResponse.body?.getReader();
    if (!reader) {
      return {
        success: false,
        headers: Object.fromEntries(getResponse.headers.entries()),
        finalUrl: currentUrl,
        redirectChain,
        status: getResponse.status,
        error: 'Response body is not readable',
      };
    }
    
    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        totalSize += value.length;
        if (totalSize > maxSizeBytes) {
          reader.cancel();
          return {
            success: false,
            headers: Object.fromEntries(getResponse.headers.entries()),
            finalUrl: currentUrl,
            redirectChain,
            status: getResponse.status,
            error: `File size exceeds ${maxSizeMB}MB limit`,
          };
        }
        
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    
    // Combine chunks into single buffer
    const buffer = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }
    
    return {
      success: true,
      buffer: buffer.buffer,
      headers: Object.fromEntries(getResponse.headers.entries()),
      finalUrl: currentUrl,
      redirectChain,
      status: getResponse.status,
    };
  } catch (error) {
    if (error instanceof SSRFError) {
      return {
        success: false,
        headers: {},
        finalUrl: currentUrl,
        redirectChain,
        status: 0,
        error: error.message,
      };
    }
    
    return {
      success: false,
      headers: {},
      finalUrl: currentUrl,
      redirectChain,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown fetch error',
    };
  }
}
