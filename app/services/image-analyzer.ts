/**
 * Main Image Analyzer
 * Orchestrates all analysis services
 */

import type { AnalysisResult, HttpHeaders } from '~/types';
import { extractMetadata, extractTimeSignals } from './metadata-extractor';
import { computeAllHashes } from './hashing';
import { analyzeContent } from './content-analyzer';
import { fetchSafeUrl } from './url-fetcher';
import { resolveProfileImageUrl } from './profile-resolver';

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Analyzes an image from URL
 */
export async function analyzeImageFromUrl(
  url: string,
  options: { maxSizeMB: number; timeoutMs: number }
): Promise<AnalysisResult> {
  // Try to resolve profile image first (e.g. from Instagram/Twitter profile URL)
  let targetUrl = url;
  
  // Simple check if it looks like a profile/page URL
  const isDirectImage = url.match(/\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i);

  try {
    const resolvedUrl = await resolveProfileImageUrl(url);
    if (resolvedUrl) {
      targetUrl = resolvedUrl;
    }
  } catch (err) {
    console.warn('Profile resolution failed:', err);
    // Continue with original URL
  }

  // Fetch the image
  const fetchResult = await fetchSafeUrl(targetUrl, options);
  
  if (!fetchResult.success || !fetchResult.buffer) {
    // Improve error message for profile URLs that failed resolution
    if (!isDirectImage && fetchResult.error?.includes('content type')) {
        throw new Error('Analysis Failed: Could not extract a public profile image due to privacy settings or anti-scraping blocks. Try using the direct image URL (right-click image -> "Copy Image Link").');
    }
    throw new Error(fetchResult.error || 'Failed to fetch image');
  }
  
  // Build HTTP headers object
  const httpHeaders: HttpHeaders = {
    status: fetchResult.status,
    headers: fetchResult.headers,
    redirect_chain: fetchResult.redirectChain,
    cdn_info: {
      server: fetchResult.headers.server,
      via: fetchResult.headers.via,
      cache_status: fetchResult.headers['x-cache'] || fetchResult.headers['cf-cache-status'],
    },
  };
  
  // Analyze the image
  return await analyzeImageBuffer(
    fetchResult.buffer,
    'url',
    url,
    fetchResult.finalUrl,
    httpHeaders
  );
}

/**
 * Analyzes an image from uploaded buffer
 */
export async function analyzeImageFromUpload(
  buffer: ArrayBuffer,
  filename?: string,
  clientPreviewDataUrl?: string | null,
  clientLastModified?: number | null
): Promise<AnalysisResult> {
  // Use client-provided preview if available, otherwise generate one server-side (only for small files)
  let previewDataUrl: string | null = clientPreviewDataUrl || null;
  
  if (!previewDataUrl) {
    // Fallback: server-side generation logic
    try {
      const bytes = new Uint8Array(buffer);
      
      // Detect mime type from magic bytes
      const header = Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
      let mime = 'image/jpeg';
      if (header.startsWith('89504e47')) mime = 'image/png';
      else if (header.startsWith('47494638')) mime = 'image/gif';
      else if (header.startsWith('52494646')) mime = 'image/webp';
      
      // For large files (>2MB), we still want a preview if possible.
      // However, storing >2MB in D1 causes errors.
      // We can try to downscale it? No, we don't have sharp/canvas.
      // We can try to just take the first X KB? No, corrupts image.
      // COMPROMISE: We will store "No Preview Available" if too big, 
      // OR we can try to rely on the browser's uploaded file object URL on the client side?
      // But the report page is server-rendered later.
      
      // Let's try to increase the limit slightly to 5MB? No, SQLITE limit is usually strict on binding size.
      // But wait, the previous error was SQLITE_TOOBIG.
      // D1 limit is 100MB for DB size, but binding parameter limit might be smaller.
      // Documentation says 128MB for binding? 
      // "SQLITE_TOOBIG: string or blob too big" usually means > 1GB or exceeding some lower limit via Wrangler/D1 proxy.
      // The default limit for a binding in Cloudflare D1 is 100MB.
      
      // Wait, the user said "limit to 50MB".
      // 50MB base64 string is massive.
      // Maybe we just disable preview for > 1MB to be safe and fast.
      
      const maxPreviewBytes = 1 * 1024 * 1024; // 1MB limit for preview to be safe
      
      if (bytes.length > maxPreviewBytes) {
        previewDataUrl = null; // Too big for D1 string storage
      } else {
        // Chunked conversion
        const chunkSize = 8192;
        let base64 = '';
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
          base64 += btoa(String.fromCharCode(...chunk));
        }
        previewDataUrl = `data:${mime};base64,${base64}`;
      }
    } catch (error) {
      console.error('Failed to create preview:', error);
      // Continue without preview
    }
  }
  
  return await analyzeImageBuffer(buffer, 'upload', null, null, undefined, previewDataUrl, clientLastModified);
}

/**
 * Core analysis function
 */
async function analyzeImageBuffer(
  buffer: ArrayBuffer,
  inputType: 'url' | 'upload',
  sourceUrl: string | null,
  finalUrl: string | null,
  httpHeaders?: HttpHeaders,
  previewDataUrl?: string | null,
  clientLastModified?: number | null
): Promise<AnalysisResult> {
  // Run all analyses in parallel
  const [metadata, hashes, contentMetrics] = await Promise.all([
    extractMetadata(buffer),
    computeAllHashes(buffer),
    analyzeContent(buffer),
  ]);
  
  // Extract time signals
  const timeSignals = extractTimeSignals(metadata, httpHeaders?.headers, clientLastModified);
  
  const result: AnalysisResult = {
    id: generateId(),
    input_type: inputType,
    source_url: sourceUrl,
    final_url: finalUrl,
    preview_data_url: previewDataUrl,
    created_at: Date.now(),
    metadata,
    hashes,
    content_metrics: contentMetrics,
    http_headers: httpHeaders,
    time_signals: timeSignals,
  };
  
  return result;
}

/**
 * Re-checks a URL that was previously analyzed
 */
export async function recheckUrl(
  previousResult: AnalysisResult,
  options: { maxSizeMB: number; timeoutMs: number }
): Promise<{
  result: AnalysisResult;
  changeType: 'unchanged' | 'content_changed' | 'headers_changed';
}> {
  if (!previousResult.source_url) {
    throw new Error('Cannot recheck: no source URL');
  }
  
  const newResult = await analyzeImageFromUrl(previousResult.source_url, options);
  
  // Determine change type
  let changeType: 'unchanged' | 'content_changed' | 'headers_changed' = 'unchanged';
  
  if (newResult.hashes.sha256 !== previousResult.hashes.sha256) {
    changeType = 'content_changed';
  } else if (
    newResult.http_headers?.headers['etag'] !== previousResult.http_headers?.headers['etag'] ||
    newResult.http_headers?.headers['last-modified'] !==
      previousResult.http_headers?.headers['last-modified']
  ) {
    changeType = 'headers_changed';
  }
  
  return { result: newResult, changeType };
}
