// Core Types for Image Intel

export interface TimeSignal {
  iso_value: string | null;
  source: string;
  reliability_note: string;
  confidence_score: number; // 0-100
}

export interface ImageMetadata {
  // File info
  file: {
    type: string;
    mime: string;
    size: number;
    magic_bytes: string;
  };
  
  // Dimensions
  dimensions: {
    width: number;
    height: number;
    aspect_ratio: string;
  };
  
  // Color info
  color: {
    model: string; // RGB, CMYK, Gray
    bit_depth: number;
    has_alpha: boolean;
    icc_profile: string | null;
  };
  
  // Animation (if applicable)
  animation?: {
    frames: number;
    duration: number;
  };
  
  // EXIF/IPTC/XMP metadata
  exif: Record<string, any>;
  iptc: Record<string, any>;
  xmp: Record<string, any>;
  
  // Sensitive data flags
  sensitive_data: {
    has_gps: boolean;
    has_serial: boolean;
    redacted_fields: string[];
  };
}

export interface ImageHashes {
  md5: string;
  sha1: string;
  sha256: string;
  phash: string;
  ahash?: string;
  dhash?: string;
}

export interface HttpHeaders {
  status: number;
  headers: Record<string, string>;
  redirect_chain: string[];
  cdn_info?: {
    server?: string;
    via?: string;
    cache_status?: string;
  };
}

export interface ContentMetrics {
  palette: Array<{
    color: string;
    percentage: number;
  }>;
  brightness: number;
  contrast: number;
  has_text_likely: boolean;
  compression_hints: {
    likely_recompressed: boolean;
    confidence: number;
    notes: string[];
  };
}

export interface AnalysisResult {
  id: string;
  input_type: "url" | "upload";
  source_url: string | null;
  final_url: string | null;
  preview_data_url?: string | null; // For uploaded files only
  created_at: number;
  
  metadata: ImageMetadata;
  hashes: ImageHashes;
  content_metrics: ContentMetrics;
  http_headers?: HttpHeaders;
  
  time_signals: {
    exif_capture_time: TimeSignal;
    exif_modify_time: TimeSignal;
    server_last_modified: TimeSignal;
    server_date: TimeSignal;
    first_seen_by_system: TimeSignal;
    client_last_modified?: TimeSignal; // New field for uploaded files
  };
}

export interface Report {
  id: string;
  user_id: string | null;
  input_type: "url" | "upload";
  source_url: string | null;
  final_url: string | null;
  created_at: number;
  sha256: string;
  phash: string;
  results_json: string; // Stringified AnalysisResult
  image_data: ArrayBuffer | null; // Stored image binary data
  content_type: string | null; // Image MIME type
  image_size: number | null; // Image size in bytes
}

export interface Event {
  id: string;
  report_id: string;
  checked_at: number;
  headers_json: string;
  sha256: string;
  change_type: "initial" | "unchanged" | "content_changed" | "headers_changed";
}

// Cloudflare Environment
export interface Env {
  DB: D1Database;
  MAX_FILE_SIZE_MB: string;
  REQUEST_TIMEOUT_MS: string;
  RATE_LIMIT_PER_MINUTE: string;
}
