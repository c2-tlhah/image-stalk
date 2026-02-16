# ProfileImageIntel Lite - Development Plan

## 1. Project Overview & Mission

**Goal:** Build a ZERO-COST (free tier only) web app + API to analyze images (via Upload or URL) and extract forensic metadata, HTTP headers, and content-derived metrics.

**Core Philosophy:**
- **Zero Cost:** No paid services, no credit cards required.
- **Honesty:** Clear labeling of timestamp sources (Server vs. EXIF vs. System).
- **Ephemeral Storage:** Do NOT store original images. Store only derived metadata and hashes.

## 2. Technical Stack

*   **Framework:** **Remix** (React-based, deploys natively to Cloudflare Pages Functions).
*   **Hosting:** Cloudflare Pages (Frontend + Backend).
*   **Database:** Cloudflare D1 (SQLite) - Free tier is generous for lightweight metadata.
*   **Image Processing:** `exifreader` (metadata), `crypto-js` (hashing), `sharp` or pure JS alternatives (like `jimp` or `upng-js`/`jpeg-js` if `sharp` is too heavy for Workers, though `sharp` via WASM is possible but tricky; might prefer lighter pure-JS libs for basics like dimensions/hashes to stay within worker limits). *Note: We will use a lightweight pure JS approach or a WASM-based image decoder to ensure compatibility with Edge runtime.*
*   **Styling:** Tailwind CSS (via Remix).

## 3. Database Schema (Cloudflare D1)

We will use three main tables.

### `users` (Minimal Auth / Session)
*   `id` (TEXT, PK): UUID
*   `created_at` (INTEGER): Unix timestamp

### `reports` (The Analysis Result)
*   `id` (TEXT, PK): UUID
*   `user_id` (TEXT): FK to users.id (nullable if allowing anonymous basic checks)
*   `input_type` (TEXT): 'url' or 'upload'
*   `source_url` (TEXT): The URL provided (NULL if upload)
*   `final_url` (TEXT): The actual URL after redirects
*   `created_at` (INTEGER): Unix timestamp (Analysis time)
*   `sha256` (TEXT): Hash of the image content
*   `phash` (TEXT): Perceptual hash for similarity
*   `results_json` (TEXT): Huge JSON blob containing ALL extracted metadata (EXIF, Dimensions, Palette, etc.)

### `events` (Change History for URLs)
*   `id` (TEXT, PK): UUID
*   `report_id` (TEXT): FK to reports.id
*   `checked_at` (INTEGER): Unix timestamp
*   `headers_json` (TEXT): HTTP response headers at this time
*   `sha256` (TEXT): content hash at this time
*   `change_type` (TEXT): 'initial', 'unchanged', 'content_changed', 'headers_changed'

## 4. Core Features & Logic

### A. URL Analysis (The "Request" Worker)
1.  **Validation:** Check URL structure (http/s only).
2.  **SSRF Protection:** Resolve DNS. **BLOCK** Localhost (127.0.0.1), Private IPs (10.x, 192.168.x, 172.16.x), Link-Local, etc.
3.  **Head Request:** Fetch headers first. Check `Content-Type` (image/*) and `Content-Length` (< 15MB).
4.  **Get Request:** Stream body. Abort if size exceeds limit or timeout (10s).
5.  **Extraction:** Buffer bytes -> Extract Metadata -> Calculate Hashes.

### B. Upload Analysis
1.  **Multipart Handling:** Remix `unstable_parseMultipartFormData`.
2.  **Limits:** Max limitation (e.g., 10MB).
3.  **Processing:** Same extraction pipeline as URL.

### C. Data Extraction Standards
*   **File:** MIME type (magic bytes), size, dimensions, format (animation frames).
*   **Metadata:** EXIF/XMP/IPTC using `exifreader`. *Privacy:* Flag GPS/Serial numbers as "Sensitive" in UI.
*   **Hashes:** MD5, SHA-1, SHA-256 (crypto), pHash (image fingerprint).
*   **Time Signals:**
    *   `EXIF DateTimeOriginal`: "Capture Time (Editable)"
    *   `HTTP Last-Modified`: "Server File Date"
    *   `System Time`: "First Seen"

### D. Security Measures
*   **Rate Limiting:** Simple in-memory or D1-backed counter (e.g., 10 requests/min per IP).
*   **Input Sanitization:** URL parsing strictness.
*   **Output Sanitization:** Redact explicit sensitive data by default in JSON response (show via toggle).

## 5. API Routes (Remix Resources)

*   `POST /api/analyze` -> Handles both JSON body `{url: ...}` and `multipart/form-data`. Returns Report ID.
*   `GET /reports/:id` -> Returns the HTML report page (Loader fetches from D1).
*   `GET /api/reports/:id/json` -> Returns raw JSON data.
*   `POST /api/reports/:id/recheck` -> Triggers a re-fetch of the URL (if applicable).

## 6. Frontend UI

*   **Home:** Clean input box for "Paste URL" and "Upload File" drag-drop zone.
*   **Report Page:**
    *   **Header:** Image Thumbnail (External URL or Base64 for upload if small, else just placeholder), File Name, Size.
    *   **Time Analysis Card:** A timeline showing Server Time, EXIF Time, and System Discovery Time.
    *   **HTTP Headers Card:** (URL only) Status, ETag, Cache-Control, Server.
    *   **Metadata Accordion:** Full EXIF dump (searchable).
    *   **Hex/structure View (Basic):** First 64 bytes hex dump.

## 7. Development Roadmap

### Phase 1: Setup & Infrastructure
1.  Initialize Remix project (Cloudflare Pages preset).
2.  Setup Tailwind CSS.
3.  Configure Wrangler (D1 database creation).

### Phase 2: Core Logic (The "Engine")
1.  Implement `analyzeImage(buffer, headers)` function.
2.  Implement `fetchSafeUrl(url)` with SSRF protection logic.
3.  Build the Hashing & Metadata extraction utilities.

### Phase 3: Database & API
1.  Create D1 schema & migrations.
2.  Build the `POST /action/analyze` Remix action.
3.  Save results to `reports` table.

### Phase 4: Frontend Visualization
1.  Build the Report View component.
2.  Add "Sensitive Data" toggles.
3.  Implement "Re-check" button functionality.

### Phase 5: Polish & Security
1.  Add Rate Limiting specific to Cloudflare Workers.
2.  Verify Error Handling (invalid URLs, non-image files).
3.  Finalize "Zero Cost" deployment check.

## 8. Limitations & Disclaimers
*   *Memory:* Cloudflare Workers standard limit (128MB) means we MUST stream or check size strictly before buffering.
*   *Storage:* We do not host images. Uploads are processed in-memory and discarded. The user sees the report, but cannot "share" the image link unless it was a URL analysis.
