/**
 * API Route: POST /api/analyze
 * Handles both URL and file upload analysis
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import type { Env } from '~/types';
import {
  analyzeImageFromUrl,
  analyzeImageFromUpload,
} from '~/services/image-analyzer';
import { saveReport } from '~/services/database';

// Rate limiting (simple in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number): boolean {
  const now = Date.now();
  const key = ip;
  const existing = rateLimitMap.get(key);
  
  if (!existing || existing.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60000 }); // 1 minute
    return true;
  }
  
  if (existing.count >= limit) {
    return false;
  }
  
  existing.count++;
  return true;
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.env as Env;
  const db = env.DB;
  
  // Get client IP for rate limiting
  const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limiting
  const rateLimit = parseInt(env.RATE_LIMIT_PER_MINUTE || '10', 10);
  if (!checkRateLimit(clientIP, rateLimit)) {
    return json(
      { success: false, error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }
  
  const contentType = request.headers.get('content-type') || '';
  
  try {
    // Handle URL-based analysis (JSON body)
    if (contentType.includes('application/json')) {
      const body = await request.json() as { url?: string };
      const { url } = body;
      
      if (!url || typeof url !== 'string') {
        return json(
          { success: false, error: 'Missing or invalid URL' },
          { status: 400 }
        );
      }
      
      const maxSizeMB = parseInt(env.MAX_FILE_SIZE_MB || '15', 10);
      const timeoutMs = parseInt(env.REQUEST_TIMEOUT_MS || '10000', 10);
      
      const result = await analyzeImageFromUrl(url, { maxSizeMB, timeoutMs });
      const reportId = await saveReport(db, result);
      
      return json({
        success: true,
        report_id: reportId,
        redirect: `/reports/${reportId}`,
      });
    }
    
    // Handle file upload (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      
      if (!file) {
        return json(
          { success: false, error: 'Missing file' },
          { status: 400 }
        );
      }
      
      // Check file size
      const maxSizeMB = parseInt(env.MAX_FILE_SIZE_MB || '15', 10);
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      if (file.size > maxSizeBytes) {
        return json(
          { success: false, error: `File too large. Maximum size: ${maxSizeMB}MB` },
          { status: 400 }
        );
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        return json(
          { success: false, error: 'Invalid file type. Please upload an image.' },
          { status: 400 }
        );
      }
      
      const buffer = await file.arrayBuffer();
      const result = await analyzeImageFromUpload(buffer, file.name);
      const reportId = await saveReport(db, result);
      
      return json({
        success: true,
        report_id: reportId,
        redirect: `/reports/${reportId}`,
      });
    }
    
    return json(
      { success: false, error: 'Invalid content type. Use application/json or multipart/form-data' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Analysis error:', error);
    
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}
