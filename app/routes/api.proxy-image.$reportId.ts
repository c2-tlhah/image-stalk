/**
 * Image Proxy Endpoint
 * Serves images from reports to bypass CORS/hotlinking restrictions
 */

import { type LoaderFunctionArgs } from '@remix-run/cloudflare';
import type { Env } from '~/types';
import { getReportById } from '~/services/database';
import { fetchSafeUrl } from '~/services/url-fetcher';

export async function loader({ params, context, request }: LoaderFunctionArgs) {
  const env = context.env as Env;
  const db = env.DB;
  const r2 = env.IMAGES; // R2 bucket for large images
  const reportId = params.reportId;
  
  if (!reportId) {
    return new Response('Report ID required', { status: 400 });
  }
  
  try {
    const report = await getReportById(db, reportId);
    
    if (!report) {
      return new Response('Report not found', { status: 404 });
    }
    
    // Priority 1: Check if we have image_data stored directly in database (small images)
    if (report.image_data) {
      const contentType = report.content_type || 'image/jpeg';
      
      return new Response(report.image_data, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'Content-Length': report.image_size?.toString() || '',
        },
      });
    }
    
    // Priority 2: Check if we have an R2 key (large images)
    if (report.r2_key) {
      const object = await r2.get(report.r2_key);
      
      if (object) {
        const contentType = report.content_type || object.httpMetadata?.contentType || 'image/jpeg';
        
        return new Response(object.body, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Content-Length': object.size.toString(),
          },
        });
      }
    }
    
    // Priority 3: Check if we have a preview_data_url (legacy base64 storage)
    const results = JSON.parse(report.results_json);
    if (results.preview_data_url) {
      // Extract base64 data
      const matches = results.preview_data_url.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const [, mimeType, base64Data] = matches;
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        return new Response(bytes, {
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }
    
    // Priority 4: For URL-based images, fetch and proxy (fallback for old reports)
    const imageUrl = report.final_url || report.source_url;
    if (!imageUrl) {
      return new Response('No image available', { status: 404 });
    }
    
    // Fetch with our safe fetcher (includes proper headers)
    const result = await fetchSafeUrl(imageUrl, {
      maxSizeMB: 10,
      timeoutMs: 15000,
    });
    
    if (!result.success || !result.buffer) {
      return new Response(result.error || 'Failed to fetch image', { status: 500 });
    }
    
    // Determine content type
    const contentType = result.headers['content-type'] || 'image/jpeg';
    
    return new Response(result.buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new Response(
      error instanceof Error ? error.message : 'Image proxy failed',
      { status: 500 }
    );
  }
}
