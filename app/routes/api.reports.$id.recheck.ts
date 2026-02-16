/**
 * API Route: POST /api/reports/:id/recheck
 * Re-analyzes a URL-based report to check for changes
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import type { Env, AnalysisResult } from '~/types';
import { getReportById, saveEvent } from '~/services/database';
import { recheckUrl } from '~/services/image-analyzer';

export async function action({ params, context }: ActionFunctionArgs) {
  const env = context.env as Env;
  const db = env.DB;
  const reportId = params.id;
  
  if (!reportId) {
    return json({ success: false, error: 'Missing report ID' }, { status: 400 });
  }
  
  try {
    // Get the original report
    const report = await getReportById(db, reportId);
    
    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    
    // Check if it's a URL-based report
    if (report.input_type !== 'url' || !report.source_url) {
      return json(
        { success: false, error: 'Can only recheck URL-based reports' },
        { status: 400 }
      );
    }
    
    // Parse the original result
    const previousResult: AnalysisResult = JSON.parse(report.results_json);
    
    // Re-analyze
    const maxSizeMB = parseInt(env.MAX_FILE_SIZE_MB || '15', 10);
    const timeoutMs = parseInt(env.REQUEST_TIMEOUT_MS || '10000', 10);
    
    const { result: newResult, changeType } = await recheckUrl(previousResult, {
      maxSizeMB,
      timeoutMs,
    });
    
    // Save the event
    await saveEvent(db, reportId, newResult, changeType);
    
    return json({
      success: true,
      change_type: changeType,
      previous_sha256: previousResult.hashes.sha256,
      current_sha256: newResult.hashes.sha256,
      changed: changeType !== 'unchanged',
    });
  } catch (error) {
    console.error('Recheck error:', error);
    
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Recheck failed',
      },
      { status: 500 }
    );
  }
}
