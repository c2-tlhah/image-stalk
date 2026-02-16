/**
 * Main Image Analyzer
 * Orchestrates all analysis services
 */

import type { AnalysisResult, HttpHeaders } from '~/types';
import { extractMetadata, extractTimeSignals } from './metadata-extractor';
import { computeAllHashes } from './hashing';
import { analyzeContent } from './content-analyzer';
import { fetchSafeUrl } from './url-fetcher';

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
  // Fetch the image
  const fetchResult = await fetchSafeUrl(url, options);
  
  if (!fetchResult.success || !fetchResult.buffer) {
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
  filename?: string
): Promise<AnalysisResult> {
  // Create a data URL for preview (ALWAYS create preview for uploads)
  let previewDataUrl: string | null = null;
  
  try {
    const bytes = new Uint8Array(buffer);
    
    // Detect mime type from magic bytes
    const header = Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
    let mime = 'image/jpeg';
    if (header.startsWith('89504e47')) mime = 'image/png';
    else if (header.startsWith('47494638')) mime = 'image/gif';
    else if (header.startsWith('52494646')) mime = 'image/webp';
    
    // Convert to base64 in chunks to avoid string length issues
    const chunkSize = 8192;
    let base64 = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
      base64 += btoa(String.fromCharCode(...chunk));
    }
    
    previewDataUrl = `data:${mime};base64,${base64}`;
  } catch (error) {
    console.error('Failed to create preview:', error);
    // Continue without preview
  }
  
  return await analyzeImageBuffer(buffer, 'upload', null, null, undefined, previewDataUrl);
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
  previewDataUrl?: string | null
): Promise<AnalysisResult> {
  // Run all analyses in parallel
  const [metadata, hashes, contentMetrics] = await Promise.all([
    extractMetadata(buffer),
    computeAllHashes(buffer),
    analyzeContent(buffer),
  ]);
  
  // Extract time signals
  const timeSignals = extractTimeSignals(metadata, httpHeaders?.headers);
  
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
