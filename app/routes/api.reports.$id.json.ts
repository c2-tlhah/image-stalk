/**
 * API Route: GET /api/reports/:id/json
 * Returns raw JSON data for a report
 */

import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import type { Env } from '~/types';
import { getReportById, getEventsByReportId } from '~/services/database';

export async function loader({ params, context }: LoaderFunctionArgs) {
  const env = context.env as Env;
  const db = env.DB;
  const reportId = params.id;
  
  if (!reportId) {
    return json({ success: false, error: 'Missing report ID' }, { status: 400 });
  }
  
  try {
    const report = await getReportById(db, reportId);
    
    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    
    // Get events if it's a URL-based report
    let events: Awaited<ReturnType<typeof getEventsByReportId>> = [];
    if (report.input_type === 'url') {
      events = await getEventsByReportId(db, reportId);
    }
    
    // Parse the results JSON
    const results = JSON.parse(report.results_json);
    
    return json({
      success: true,
      report: {
        id: report.id,
        input_type: report.input_type,
        source_url: report.source_url,
        final_url: report.final_url,
        created_at: report.created_at,
        sha256: report.sha256,
        phash: report.phash,
      },
      results,
      events: events.map((e) => ({
        id: e.id,
        checked_at: e.checked_at,
        change_type: e.change_type,
        sha256: e.sha256,
        headers: JSON.parse(e.headers_json),
      })),
    });
  } catch (error) {
    console.error('Report fetch error:', error);
    
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch report',
      },
      { status: 500 }
    );
  }
}
