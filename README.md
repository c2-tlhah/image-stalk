# ProfileStalk

**🔍 Zero-cost image forensics and OSINT tool for analyzing profile pictures and images**

Built with Remix + Cloudflare Pages + D1. Extract metadata, track changes, and uncover the story behind any image—all on free-tier infrastructure.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-orange)](docs/DEPLOYMENT.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🚀 Features

- **URL Analysis**: Fetch and analyze images from any public URL
- **File Upload**: Analyze images directly from your device
- **Metadata Extraction**: EXIF, IPTC, XMP data with privacy-first redaction
- **HTTP Header Analysis**: Captures response headers, redirects, CDN info
- **Content Hashing**: SHA-256, SHA-1, MD5, and perceptual hashes
- **Time Signal Analysis**: Multiple timestamp sources with confidence scoring
- **Compression Detection**: Algorithmic hints for re-compression/editing
- **Change Tracking**: Monitor URLs over time for content changes
- **Privacy-First**: GPS and serial numbers redacted by default

---

## 🛠️ Tech Stack

- **Framework**: [Remix](https://remix.run/) (React-based, fullstack)
- **Runtime**: Cloudflare Pages + Workers
- **Database**: Cloudflare D1 (SQLite)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

---

## 📦 Project Structure

```
├── app/
│   ├── routes/                  # Remix routes (pages + API endpoints)
│   │   ├── _index.tsx          # Home page with upload/URL input
│   │   ├── reports.$id.tsx     # Report detail page
│   │   ├── api.analyze.ts      # POST /api/analyze
│   │   ├── api.reports.$id.json.ts         # GET report JSON
│   │   └── api.reports.$id.recheck.ts      # POST recheck URL
│   ├── services/               # Backend logic
│   │   ├── ssrf-protection.ts  # SSRF validation
│   │   ├── url-fetcher.ts      # Safe HTTP fetcher
│   │   ├── hashing.ts          # Cryptographic hashing
│   │   ├── metadata-extractor.ts # EXIF/IPTC/XMP extraction
│   │   ├── content-analyzer.ts # Palette, compression hints
│   │   ├── image-analyzer.ts   # Main orchestration
│   │   └── database.ts         # D1 operations
│   ├── lib/                    # Shared utilities
│   ├── types/                  # TypeScript types
│   ├── components/             # UI components (future)
│   └── styles/                 # CSS
├── migrations/                 # D1 database migrations
├── tests/                      # Unit tests
├── public/                     # Static assets
├── wrangler.toml              # Cloudflare configuration
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Cloudflare account** (free tier)
- **Wrangler CLI**: `npm install -g wrangler`

### 1. Clone and Install

```powershell
git clone <your-repo-url> profile-image-intel-lite
cd profile-image-intel-lite
npm install
```

### 2. Setup Cloudflare D1 Database

```powershell
# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create profile-image-intel
```

Copy the database ID from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "profile-image-intel"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Replace this
```

### 3. Run Database Migrations

```powershell
# For local development
wrangler d1 execute profile-image-intel --local --file=./migrations/0001_initial_schema.sql

# For production (after deploying)
wrangler d1 execute profile-image-intel --remote --file=./migrations/0001_initial_schema.sql
```

### 4. Local Development

**Fast Development (Local Database)**
```powershell
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

- ✅ Fast hot reload
- ✅ Isolated test data
- ❌ Data not saved to production database

**Test with Production Database (Remote)**
```powershell
npm run dev:remote
```

Visit [http://localhost:8788](http://localhost:8788)

- ✅ Uses remote D1 database (same as deployed app)
- ✅ Data persists to production
- ❌ Slower (network latency)
- ❌ Requires rebuild on code changes

> 📖 **See [docs/DEV_REMOTE_DB.md](docs/DEV_REMOTE_DB.md) for detailed guide on local vs remote database**

### 5. Run Tests

```powershell
# Run all tests
npm test

# Run specific tests
npm run test:ssrf
npm run test:hash
```

---

## 🌐 Deployment to Cloudflare Pages

### Option 1: Via Wrangler CLI

```powershell
# Build the project
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

### Option 2: Via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
2. Click **Create a project** → **Connect to Git**
3. Select your repository
4. **Build settings**:
   - Build command: `npm run build`
   - Build output directory: `build/client`
   - Root directory: `/`
5. **Environment variables**: Add these in the dashboard:
   - `MAX_FILE_SIZE_MB`: `15`
   - `REQUEST_TIMEOUT_MS`: `10000`
   - `RATE_LIMIT_PER_MINUTE`: `10`
6. Under **Settings** → **Functions** → **D1 database bindings**:
   - Variable name: `DB`
   - D1 database: Select `profile-image-intel`
7. Deploy!

### Post-Deployment

After deployment, run the migration on the remote database:

```powershell
wrangler d1 execute profile-image-intel --remote --file=./migrations/0001_initial_schema.sql
```

---

## 🔧 Configuration

Edit `wrangler.toml` to customize:

```toml
[vars]
MAX_FILE_SIZE_MB = "15"            # Maximum image size
REQUEST_TIMEOUT_MS = "10000"       # Fetch timeout (10 seconds)
RATE_LIMIT_PER_MINUTE = "10"       # Requests per IP per minute
```

---

## 🧪 Testing

### SSRF Protection Tests

```powershell
npm run test:ssrf
```

Tests blocking of:
- localhost / 127.0.0.1
- Private IP ranges (10.x, 192.168.x, 172.x)
- Cloud metadata endpoints
- Invalid protocols (file://, ftp://)

### Hashing & Metadata Tests

```powershell
npm run test:hash
```

Tests:
- SHA-256 hashing
- File type detection (JPEG, PNG, GIF, etc.)
- Magic bytes extraction
- Hex dump generation

---

## 📊 Database Schema

### `reports` table
Stores analysis results.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Report ID |
| `user_id` | TEXT | User ID (nullable) |
| `input_type` | TEXT | 'url' or 'upload' |
| `source_url` | TEXT | Original URL (nullable) |
| `final_url` | TEXT | Final URL after redirects |
| `created_at` | INTEGER | Unix timestamp |
| `sha256` | TEXT | Content hash |
| `phash` | TEXT | Perceptual hash |
| `results_json` | TEXT | Full analysis result (JSON) |

### `events` table
Tracks changes for URL-based reports.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Event ID |
| `report_id` | TEXT (FK) | References `reports.id` |
| `checked_at` | INTEGER | Unix timestamp |
| `headers_json` | TEXT | HTTP headers (JSON) |
| `sha256` | TEXT | Content hash at check time |
| `change_type` | TEXT | 'initial', 'unchanged', 'content_changed', 'headers_changed' |

---

## 🔒 Security & Privacy

### SSRF Protection
- Blocks localhost, private IPs, link-local, and cloud metadata endpoints
- Manual redirect handling with validation at each hop
- Maximum redirect limit enforced

### Rate Limiting
- Simple in-memory rate limiting per IP
- Configurable via `RATE_LIMIT_PER_MINUTE`

### Privacy
- **No image storage**: Original images are never stored, only metadata and hashes
- **Sensitive data redaction**: GPS coordinates and serial numbers hidden by default
- **User control**: "Show Sensitive Data" toggle in the UI

### Content Limits
- Max file size: 15MB (configurable)
- Fetch timeout: 10 seconds
- Enforced both client-side and server-side

---

## 📝 API Reference

### `POST /api/analyze`

Analyze an image by URL or upload.

**JSON body (URL analysis):**
```json
{
  "url": "https://example.com/image.jpg"
}
```

**Multipart body (file upload):**
```
Content-Type: multipart/form-data
file: <binary>
```

**Response:**
```json
{
  "success": true,
  "report_id": "1234567890-abc123",
  "redirect": "/reports/1234567890-abc123"
}
```

### `GET /api/reports/:id/json`

Get raw JSON data for a report.

**Response:**
```json
{
  "success": true,
  "report": { ... },
  "results": { ... },
  "events": [ ... ]
}
```

### `POST /api/reports/:id/recheck`

Re-analyze a URL-based report.

**Response:**
```json
{
  "success": true,
  "change_type": "content_changed",
  "previous_sha256": "abc...",
  "current_sha256": "def...",
  "changed": true
}
```

---

## ⚠️ Limitations & Disclaimers

### Timestamp Reliability
- **EXIF timestamps** can be easily edited by users
- **HTTP Last-Modified** headers reflect server file modification time, not necessarily the original upload time
- **System timestamps** are when our system first analyzed the image

### Analysis Accuracy
- **Compression hints** are algorithmic approximations, not definitive proof of editing
- **Perceptual hashing** is currently simplified; for production, use a dedicated library
- **Palette extraction** is a crude approximation from image bytes

### Cost Limits
- **Cloudflare Pages Free Tier**:
  - 500 builds/month
  - 100,000 requests/day
  - Unlimited bandwidth
- **Cloudflare D1 Free Tier**:
  - 5 GB storage
  - 5 million rows read/day
  - 100,000 rows written/day
- **Workers Free Tier**:
  - 100,000 requests/day
  - 10ms CPU time per request

---

## 📚 Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deploy to Cloudflare Pages via GitHub or CLI
- **[Remote Database Setup](docs/DEV_REMOTE_DB.md)** - Use production database locally
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and data flow
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute code
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community standards
- **[Security Policy](SECURITY.md)** - Reporting vulnerabilities
- **[Changelog](CHANGELOG.md)** - Version history

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting PRs.

Quick start:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with:
- [Remix](https://remix.run/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [ExifReader](https://github.com/mattiasw/ExifReader)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📧 Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ for the forensics and OSINT community.**
