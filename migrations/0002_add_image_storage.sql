-- Migration: Add Image Storage
-- Created: 2026-02-16
-- Description: Adds columns to store image data in the database

-- Add r2_key to store R2 object key for large images
ALTER TABLE reports ADD COLUMN r2_key TEXT;

-- Add image_data BLOB column to store small images directly (< 900KB to stay under 1MB D1 limit)
ALTER TABLE reports ADD COLUMN image_data BLOB;

-- Add content_type to store the image mime type
ALTER TABLE reports ADD COLUMN content_type TEXT;

-- Add image_size to track storage usage
ALTER TABLE reports ADD COLUMN image_size INTEGER;
