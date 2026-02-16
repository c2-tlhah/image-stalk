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
 * Result with image data for storage
 */
export interface AnalysisResultWithImage {
  result: AnalysisResult;
  imageBuffer: ArrayBuffer;
  contentType: string;
}

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
): Promise<AnalysisResultWithImage> {
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
  const result = await analyzeImageBuffer(
    fetchResult.buffer,
    'url',
    url,
    fetchResult.finalUrl,
    httpHeaders
  );
  
  // Determine content type
  const contentType = fetchResult.headers['content-type'] || 'image/jpeg';
  
  return {
    result,
    imageBuffer: fetchResult.buffer,
    contentType,
  };
}

/**
 * Analyzes an image from uploaded buffer
 */
export async function analyzeImageFromUpload(
  buffer: ArrayBuffer,
  filename?: string,
  clientPreviewDataUrl?: string | null,
  clientLastModified?: number | null,
  clientExif?: any
): Promise<AnalysisResultWithImage> {
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
      
      // IMPORTANT: We're storing images in the database now,
      // so we don't need to embed large base64 previews.
      // We'll disable preview generation entirely and rely on database storage.
      previewDataUrl = null;
    } catch (error) {
      console.error('Failed to create preview:', error);
      // Continue without preview
    }
  }
  
  const result = await analyzeImageBuffer(buffer, 'upload', null, null, undefined, previewDataUrl, clientLastModified, clientExif);
  
  // Detect content type from buffer
  const bytes = new Uint8Array(buffer);
  const header = Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
  let contentType = 'image/jpeg';
  if (header.startsWith('89504e47')) contentType = 'image/png';
  else if (header.startsWith('47494638')) contentType = 'image/gif';
  else if (header.startsWith('52494646')) contentType = 'image/webp';
  else if (header.startsWith('424d')) contentType = 'image/bmp';
  
  return {
    result,
    imageBuffer: buffer,
    contentType,
  };
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
  clientLastModified?: number | null,
  clientExif?: any
): Promise<AnalysisResult> {
  // Run all analyses in parallel
  const [metadata, hashes, contentMetrics] = await Promise.all([
    extractMetadata(buffer, clientExif),
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
  
  const analysisResult = await analyzeImageFromUrl(previousResult.source_url, options);
  
  // Determine change type
  let changeType: 'unchanged' | 'content_changed' | 'headers_changed' = 'unchanged';
  
  if (analysisResult.result.hashes.sha256 !== previousResult.hashes.sha256) {
    changeType = 'content_changed';
  } else if (
    analysisResult.result.http_headers?.headers['etag'] !== previousResult.http_headers?.headers['etag'] ||
    analysisResult.result.http_headers?.headers['last-modified'] !==
      previousResult.http_headers?.headers['last-modified']
  ) {
    changeType = 'headers_changed';
  }
  
  return { result: analysisResult.result, changeType };
}
