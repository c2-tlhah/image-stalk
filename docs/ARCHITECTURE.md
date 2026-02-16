# Architecture Overview

## System Design

ProfileStalk is a serverless image forensics application built on Cloudflare's edge computing platform.

```
┌─────────────────────────────────────────────────────────────┐
│                         User/Client                          │
│                    (Browser/API Client)                      │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                          │
│                    (Global CDN)                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Remix Framework                      │  │
│  │                                                        │  │
│  │  ┌─────────────┐         ┌─────────────────────┐    │  │
│  │  │   Routes    │────────▶│   API Endpoints     │    │  │
│  │  │  (UI Pages) │         │  /api/analyze       │    │  │
│  │  └─────────────┘         │  /api/proxy-image   │    │  │
│  │                          │  /api/recheck       │    │  │
│  │                          └─────────┬───────────┘    │  │
│  │                                    │                 │  │
│  │                                    ▼                 │  │
│  │                          ┌─────────────────────┐    │  │
│  │                          │   Service Layer     │    │  │
│  │                          │                     │    │  │
│  │                          │  • ImageAnalyzer    │    │  │
│  │                          │  • URLFetcher       │    │  │
│  │                          │  • MetadataExtract  │    │  │
│  │                          │  • ContentAnalyzer  │    │  │
│  │                          │  • Hashing          │    │  │
│  │                          │  • SSRFProtection   │    │  │
│  │                          │  • Database         │    │  │
│  │                          └─────────┬───────────┘    │  │
│  └────────────────────────────────────┼────────────────┘  │
└─────────────────────────────────────┼─────────────────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────┐
                    │     Cloudflare D1            │
                    │   (SQLite Database)          │
                    │                              │
                    │  • reports table             │
                    │  • events table              │
                    │  • users table               │
                    └──────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Meta-framework**: Remix 2.8
- **Styling**: Tailwind CSS 3.4
- **UI Theme**: Terminal/hacker aesthetic (green-on-black)

### Backend
- **Runtime**: Cloudflare Workers (V8 isolates)
- **Adapter**: @remix-run/cloudflare-pages
- **Database**: Cloudflare D1 (SQLite)
- **Language**: TypeScript 5.1 (strict mode)

### Key Libraries
- **ExifReader 4.20**: EXIF/IPTC/XMP extraction
- **Native APIs**: Web Crypto API, Fetch API, ArrayBuffer

## Core Components

### 1. Image Analyzer (`app/services/image-analyzer.ts`)

**Purpose**: Orchestrates the entire analysis pipeline

**Flow**:
```
Input (URL or Upload)
    │
    ├─▶ URL Analysis
    │   ├─▶ SSRF Protection
    │   ├─▶ Safe URL Fetch (with CDN headers)
    │   ├─▶ HTTP Header Capture
    │   └─▶ Redirect Chain Tracking
    │
    ├─▶ Image Buffer Analysis
    │   ├─▶ Metadata Extraction (EXIF/IPTC/XMP)
    │   ├─▶ Content Analysis (brightness, contrast)
    │   ├─▶ Hashing (SHA-256, SHA-1, pHash)
    │   └─▶ Time Signal Analysis
    │
    └─▶ Result Assembly
        └─▶ Database Storage
```

### 2. SSRF Protection (`app/services/ssrf-protection.ts`)

**Security layer preventing Server-Side Request Forgery attacks**

**Blocked**:
- Private IP ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- Localhost: `127.0.0.0/8`, `::1`
- Link-local: `169.254.0.0/16`
- Cloud metadata: `169.254.169.254`
- IPv6 private: `fc00::/7`, `fe80::/10`

**Validation**:
1. URL structure validation
2. Hostname blocklist check
3. IP address validation
4. Redirect target verification

### 3. URL Fetcher (`app/services/url-fetcher.ts`)

**Safe HTTP client with CDN compatibility**

**Features**:
- Browser-like headers (User-Agent, Accept, etc.)
- Manual redirect handling (for SSRF checks)
- Size limits (15MB default)
- Timeout protection (10s default)
- Content-Type validation
- Streaming with size checks

**Headers sent**:
```javascript
{
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Dest': 'image',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'cross-site'
}
```

### 4. Metadata Extractor (`app/services/metadata-extractor.ts`)

**Extracts and processes image metadata**

**Supported**:
- EXIF (Exchangeable Image File Format)
- IPTC (International Press Telecommunications Council)
- XMP (Extensible Metadata Platform)

**Privacy Features**:
- GPS coordinates → "REDACTED"
- Serial numbers → "REDACTED"
- Camera owner → "REDACTED"

**Special Processing**:
- EXIF date conversion (`YYYY:MM:DD HH:MM:SS` → ISO 8601)
- Fallback date extraction from multiple sources
- Confidence scoring for dates

### 5. Hashing (`app/services/hashing.ts`)

**Cryptographic and perceptual hashing**

**Algorithms**:
- **SHA-256**: Cryptographic hash (64 hex chars)
- **SHA-1**: Legacy compatibility (40 hex chars)
- **pHash**: Perceptual hash for duplicate detection (simplified, 16 hex chars)

**Implementation**:
```typescript
// Uses Web Crypto API (native, no dependencies)
const buffer = new Uint8Array(imageData);
const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
```

### 6. Content Analyzer (`app/services/content-analyzer.ts`)

**Analyzes visual content**

**Metrics**:
- **Brightness**: Average luminance (0-100%)
- **Contrast**: Standard deviation of luminance (0-100%)

**Algorithm**:
- Sample compressed image data (skip headers)
- Extract byte triplets as pseudo-RGB
- Calculate luminance: `0.299*R + 0.587*G + 0.114*B`
- Compute average and standard deviation

### 7. Database Service (`app/services/database.ts`)

**D1 database operations**

**Schema**:
```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  input_type TEXT CHECK(input_type IN ('url', 'upload')),
  source_url TEXT,
  final_url TEXT,
  created_at INTEGER,
  sha256 TEXT,
  phash TEXT,
  results_json TEXT  -- Full AnalysisResult as JSON
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  report_id TEXT,
  checked_at INTEGER,
  change_type TEXT CHECK(change_type IN ('initial', 'unchanged', 'content_changed', 'headers_changed')),
  sha256 TEXT,
  results_json TEXT
);
```

**Operations**:
- `saveReport()`: Insert new report
- `getReportById()`: Retrieve by ID
- `saveEvent()`: Track changes for URL-based reports
- `getEventsByReportId()`: Get change history

### 8. Image Proxy (`app/routes/api.proxy-image.$reportId.ts`)

**Bypasses CORS and hotlinking restrictions**

**Flow**:
```
Browser requests: /api/proxy-image/{reportId}
    │
    ├─▶ Lookup report in database
    │
    ├─▶ If upload: Serve from stored base64
    │
    └─▶ If URL: Fetch with proper headers → Return as-is
```

**Benefits**:
- Instagram images load correctly
- Facebook CDN works
- No CORS errors
- Caching headers set appropriately

## Data Flow

### URL Analysis Flow

```
1. User enters URL
2. POST /api/analyze { url: "..." }
3. SSRF validation
4. Fetch URL (with browser headers)
5. Extract metadata (EXIF/IPTC/XMP)
6. Compute hashes (SHA-256, SHA-1, pHash)
7. Analyze content (brightness, contrast)
8. Store report in D1
9. Return report ID
10. Redirect to /reports/{id}
11. Display results + image proxy
```

### Upload Analysis Flow

```
1. User uploads file
2. POST /api/analyze (multipart/form-data)
3. Validate file type & size
4. Convert to ArrayBuffer
5. Create base64 preview (for display)
6. Extract metadata
7. Compute hashes
8. Analyze content
9. Store report in D1 (includes base64 preview)
10. Return report ID
11. Redirect to /reports/{id}
12. Display results + preview from DB
```

### Re-check URL Flow

```
1. User clicks "Re-check URL"
2. POST /api/reports/{id}/recheck
3. Fetch report from DB
4. Re-fetch URL (same as initial analysis)
5. Compare SHA-256 hashes
6. Determine change type:
   - unchanged
   - content_changed
   - headers_changed
7. Save event to DB
8. Return updated report
```

## Security Architecture

### Defense Layers

1. **SSRF Protection**: Blocks private/local/metadata IPs
2. **Input Validation**: Type, size, format checks
3. **Rate Limiting**: Per-IP request limits
4. **Timeout Protection**: 10s max per request
5. **Content-Type Validation**: Only image/* allowed
6. **Size Limits**: 15MB max file size
7. **Privacy Redaction**: GPS/serial numbers removed

### Threat Model

**Protected Against**:
- ✅ SSRF (Server-Side Request Forgery)
- ✅ File upload DoS (size limits)
- ✅ Slowloris attacks (timeouts)
- ✅ Private network scanning
- ✅ Cloud metadata access
- ✅ Basic DDoS (rate limiting)

**Not Protected Against** (by design):
- ❌ Sophisticated DDoS (use Cloudflare built-in protection)
- ❌ Account takeover (no authentication)
- ❌ Advanced persistent threats

## Performance Characteristics

### Edge Computing Benefits

- **Global deployment**: 300+ Cloudflare locations
- **Cold start**: <10ms (V8 isolates)
- **Response time**: 
  - Local images: 50-200ms
  - Remote images: 500-2000ms (depends on source)
- **Scalability**: Auto-scales to 100,000 req/day (free tier)

### Bottlenecks

1. **External URL fetch**: Limited by remote server speed
2. **Metadata extraction**: ~50-100ms for large EXIF data
3. **Database writes**: ~20-50ms (D1 latency)
4. **Image proxy**: Adds latency for external images

### Optimization Strategies

- Parallel processing where possible
- Streaming large files (not loading entirely into memory)
- Efficient base64 encoding (chunked)
- Browser caching for static assets
- D1 indexing on frequently queried fields

## Deployment Architecture

```
GitHub Repository
    │
    └─▶ Push to main branch
        │
        ▼
    Cloudflare Pages (Auto-Deploy)
        │
        ├─▶ Build: npm run build
        │   └─▶ Output: ./build/client
        │
        ├─▶ Deploy to Edge
        │   └─▶ 300+ locations worldwide
        │
        └─▶ Bind D1 Database
            └─▶ profile-image-intel
```

## Future Architecture Considerations

### Potential Enhancements

1. **Worker KV**: Cache frequently accessed reports
2. **R2 Storage**: Store large image files (avoid base64 in D1)
3. **Durable Objects**: Rate limiting with persistent state
4. **Queue**: Async analysis for large images
5. **Analytics Engine**: Track usage patterns
6. **Image Transforms**: Generate thumbnails, optimize size

### Scaling Strategy

Current free tier limits:
- 100,000 requests/day
- 5 million D1 reads/day
- 100,000 D1 writes/day

If exceeded:
1. Upgrade to Cloudflare paid plan (~$5/month)
2. Add caching layer (KV)
3. Optimize database queries
4. Consider CDN for popular images

---

**This architecture is designed for zero-cost operation at moderate scale with room to grow.**
