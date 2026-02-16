-- Migration: Initial Schema
-- Created: 2026-02-16
-- Description: Creates tables for users, reports, and events

-- Users table (optional for auth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

-- Reports table (main analysis results)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  input_type TEXT NOT NULL CHECK(input_type IN ('url', 'upload')),
  source_url TEXT,
  final_url TEXT,
  created_at INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  phash TEXT NOT NULL,
  results_json TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Events table (track changes over time for URL-based reports)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  checked_at INTEGER NOT NULL,
  headers_json TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK(change_type IN ('initial', 'unchanged', 'content_changed', 'headers_changed')),
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_sha256 ON reports(sha256);
CREATE INDEX IF NOT EXISTS idx_reports_phash ON reports(phash);
CREATE INDEX IF NOT EXISTS idx_reports_source_url ON reports(source_url);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_report_id ON events(report_id);
CREATE INDEX IF NOT EXISTS idx_events_checked_at ON events(checked_at DESC);
