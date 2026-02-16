-- Migration: Add R2 Key Support
-- Created: 2026-02-16
-- Description: Adds R2 key column for large image storage

-- Add r2_key to store R2 object key for large images
ALTER TABLE reports ADD COLUMN r2_key TEXT;
