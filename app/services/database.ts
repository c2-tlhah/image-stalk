/**
 * Database Operations for Cloudflare D1
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { AnalysisResult, Report, Event } from '~/types';

/**
 * Generates a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Saves an analysis result to the database
 */
export async function saveReport(
  db: D1Database,
  result: AnalysisResult,
  userId: string | null = null
): Promise<string> {
  const reportId = generateId();
  
  await db
    .prepare(
      `INSERT INTO reports (id, user_id, input_type, source_url, final_url, created_at, sha256, phash, results_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      reportId,
      userId,
      result.input_type,
      result.source_url,
      result.final_url,
      result.created_at,
      result.hashes.sha256,
      result.hashes.phash,
      JSON.stringify(result)
    )
    .run();
  
  // Also create initial event if it's a URL-based report
  if (result.input_type === 'url' && result.http_headers) {
    await saveEvent(db, reportId, result, 'initial');
  }
  
  return reportId;
}

/**
 * Saves an event (for tracking changes)
 */
export async function saveEvent(
  db: D1Database,
  reportId: string,
  result: AnalysisResult,
  changeType: 'initial' | 'unchanged' | 'content_changed' | 'headers_changed'
): Promise<string> {
  const eventId = generateId();
  
  await db
    .prepare(
      `INSERT INTO events (id, report_id, checked_at, headers_json, sha256, change_type)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      eventId,
      reportId,
      Date.now(),
      JSON.stringify(result.http_headers?.headers || {}),
      result.hashes.sha256,
      changeType
    )
    .run();
  
  return eventId;
}

/**
 * Gets a report by ID
 */
export async function getReportById(db: D1Database, reportId: string): Promise<Report | null> {
  const result = await db
    .prepare('SELECT * FROM reports WHERE id = ?')
    .bind(reportId)
    .first<Report>();
  
  return result;
}

/**
 * Gets all events for a report
 */
export async function getEventsByReportId(db: D1Database, reportId: string): Promise<Event[]> {
  const result = await db
    .prepare('SELECT * FROM events WHERE report_id = ? ORDER BY checked_at DESC')
    .bind(reportId)
    .all<Event>();
  
  return result.results || [];
}

/**
 * Gets recent reports
 */
export async function getRecentReports(
  db: D1Database,
  limit: number = 10,
  offset: number = 0
): Promise<Report[]> {
  const result = await db
    .prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<Report>();
  
  return result.results || [];
}

/**
 * Finds reports by SHA-256 hash
 */
export async function findReportsByHash(db: D1Database, sha256: string): Promise<Report[]> {
  const result = await db
    .prepare('SELECT * FROM reports WHERE sha256 = ? ORDER BY created_at DESC')
    .bind(sha256)
    .all<Report>();
  
  return result.results || [];
}

/**
 * Finds reports by source URL
 */
export async function findReportsByUrl(db: D1Database, url: string): Promise<Report[]> {
  const result = await db
    .prepare('SELECT * FROM reports WHERE source_url = ? ORDER BY created_at DESC')
    .bind(url)
    .all<Report>();
  
  return result.results || [];
}

/**
 * Gets statistics
 */
export async function getStats(db: D1Database): Promise<{
  total_reports: number;
  total_events: number;
  report_types: { url: number; upload: number };
}> {
  const totalReports = await db
    .prepare('SELECT COUNT(*) as count FROM reports')
    .first<{ count: number }>();
  
  const totalEvents = await db
    .prepare('SELECT COUNT(*) as count FROM events')
    .first<{ count: number }>();
  
  const urlReports = await db
    .prepare("SELECT COUNT(*) as count FROM reports WHERE input_type = 'url'")
    .first<{ count: number }>();
  
  const uploadReports = await db
    .prepare("SELECT COUNT(*) as count FROM reports WHERE input_type = 'upload'")
    .first<{ count: number }>();
  
  return {
    total_reports: totalReports?.count || 0,
    total_events: totalEvents?.count || 0,
    report_types: {
      url: urlReports?.count || 0,
      upload: uploadReports?.count || 0,
    },
  };
}
