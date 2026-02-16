<div align="center">

# 🔍 ProfileStalk

### Professional Image Forensics & OSINT Analysis Platform

*Extract metadata, track changes, and uncover digital fingerprints from any image*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/c2-tlhah/image-stalk/actions/workflows/ci.yml/badge.svg)](https://github.com/c2-tlhah/image-stalk/actions/workflows/ci.yml)
[![Deploy](https://github.com/c2-tlhah/image-stalk/actions/workflows/deploy.yml/badge.svg)](https://github.com/c2-tlhah/image-stalk/actions/workflows/deploy.yml)
[![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](docs/DEPLOYMENT.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Remix](https://img.shields.io/badge/Remix-2.8-000000?logo=remix&logoColor=white)](https://remix.run)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[**🚀 Quick Start**](#-quick-start) • [**📖 Documentation**](docs/) • [**💬 Discussions**](https://github.com/c2-tlhah/image-stalk/discussions)

---

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Use Cases](#-use-cases)
- [Quick Start](#-quick-start)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [Security & Privacy](#-security--privacy)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**ProfileStalk** is a zero-cost, privacy-focused image forensics platform built for OSINT investigators, journalists, security researchers, and digital forensics professionals. Analyze profile pictures and images from any source to extract metadata, detect modifications, track changes over time, and uncover hidden information.

### Why ProfileStalk?

- ✅ **100% Free** - Runs entirely on Cloudflare's free tier
- ✅ **Privacy-First** - No image storage, sensitive data auto-redacted
- ✅ **Production-Ready** - TypeScript, comprehensive tests, enterprise architecture
- ✅ **Open Source** - MIT licensed, transparent, auditable
- ✅ **Fast & Global** - Edge computing across 300+ locations worldwide

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🌐 Multi-Source Analysis
- **URL Fetching** with Instagram/Facebook/CDN support
- **File Upload** up to 15MB (JPEG, PNG, GIF, WebP)
- **Smart Proxying** to bypass CORS restrictions
- **Redirect Tracking** with full chain visibility

</td>
<td width="50%">

### 📊 Comprehensive Metadata
- **EXIF** extraction (camera, lens, settings)
- **IPTC** parsing (captions, keywords, copyright)
- **XMP** support (Adobe metadata)
- **HTTP Headers** (Last-Modified, ETag, CDN info)

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Security & Hashing
- **SHA-256** cryptographic hashing
- **SHA-1** for legacy compatibility
- **Perceptual Hash** for duplicate detection
- **SSRF Protection** against network attacks

</td>
<td width="50%">

### ⏱️ Timeline Intelligence
- **Multi-Source Timestamps** (EXIF, HTTP, system)
- **Confidence Scoring** for date reliability
- **Change Detection** for URL monitoring
- **Historical Tracking** with event logs

</td>
</tr>
<tr>
<td width="50%">

### 🔒 Privacy Features
- **Auto-Redaction** of GPS coordinates
- **Serial Number Hiding** (camera identifiers)
- **Toggle Controls** for sensitive data
- **No Storage** - images analyzed in memory only

</td>
<td width="50%">

### 🎨 Content Analysis
- **Brightness** calculation (0-100%)
- **Contrast** analysis (standard deviation)
- **Compression Hints** for edit detection
- **Format Detection** via magic bytes

</td>
</tr>
</table>

---

## 💼 Use Cases

<table>
<tr>
<td width="50%">

### 🔍 OSINT Investigations
- Track profile picture changes across platforms
- Verify image authenticity and origin
- Build timelines from metadata
- Detect manipulated images

</td>
<td width="50%">

### 📰 Journalism & Verification
- Verify user-submitted photos
- Cross-reference image sources
- Detect stock photos or stolen content
- Build evidence chains

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ Security Research
- Analyze phishing profile images
- Track threat actor infrastructure
- Monitor impersonation attempts
- Digital fingerprinting

</td>
<td width="50%">

### 💼 Digital Forensics
- Evidence collection and preservation
- Metadata timeline construction
- Hash-based deduplication
- Court-ready documentation

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier)
- [Git](https://git-scm.com/)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/c2-tlhah/image-stalk.git
cd image-stalk

# 2. Install dependencies
npm install

# 3. Login to Cloudflare
npx wrangler login

# 4. Create D1 database
npx wrangler d1 create profile-image-intel
# Copy the database_id from output and update wrangler.toml

# 5. Run database migrations
npx wrangler d1 execute profile-image-intel --local --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute profile-image-intel --remote --file=./migrations/0001_initial_schema.sql

# 6. Start development server
npm run dev
```

Visit **http://localhost:5173** and start analyzing images!

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="25%">
<img src="https://cdn.simpleicons.org/remix/000000" width="48" height="48"/><br/>
<strong>Remix</strong><br/>
<sub>React Framework</sub>
</td>
<td align="center" width="25%">
<img src="https://cdn.simpleicons.org/cloudflare/F38020" width="48" height="48"/><br/>
<strong>Cloudflare</strong><br/>
<sub>Edge Platform</sub>
</td>
<td align="center" width="25%">
<img src="https://cdn.simpleicons.org/typescript/3178C6" width="48" height="48"/><br/>
<strong>TypeScript</strong><br/>
<sub>Type Safety</sub>
</td>
<td align="center" width="25%">
<img src="https://cdn.simpleicons.org/tailwindcss/06B6D4" width="48" height="48"/><br/>
<strong>Tailwind CSS</strong><br/>
<sub>Styling</sub>
</td>
</tr>
</table>

### Architecture Highlights

- **Runtime**: Cloudflare Workers (V8 isolates, <10ms cold start)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **CDN**: 300+ global locations
- **API**: RESTful with JSON responses
- **Testing**: Unit tests with tsx

[📖 Read detailed architecture](docs/ARCHITECTURE.md)

---

## 💻 Development

### Local Development (Fast)

Uses local D1 database for fast iteration:

```bash
npm run dev
```

- ✅ **Instant hot reload**
- ✅ **Isolated test data**
- ⚡ **No network latency**

### Test with Production Database

Connect to remote D1 database:

```bash
npm run dev:remote
```

- ✅ **Production parity**
- ✅ **Shared data**
- 📖 [Learn more](docs/DEV_REMOTE_DB.md)

### Run Tests

```bash
# All tests
npm test

# Specific test suites
npm run test:ssrf    # SSRF protection tests
npm run test:hash    # Hashing tests

# Type checking
npm run typecheck
```

### Configuration

Edit `wrangler.toml`:

```toml
[vars]
MAX_FILE_SIZE_MB = "15"           # Maximum upload size
REQUEST_TIMEOUT_MS = "10000"      # Fetch timeout
RATE_LIMIT_PER_MINUTE = "10"      # Rate limit per IP
```

---

## 🚀 Deployment

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub** (already done! ✅)
2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages** → **Create Application**
   - Select **Pages** → **Connect to Git**
   - Choose `profilestalk` repository
   - Configure:
     - Build command: `npm run build`
     - Build output: `build/client`
3. **Add D1 Binding**:
   - Go to **Settings** → **Functions** → **D1 bindings**
   - Variable: `DB`
   - Database: `profile-image-intel`
4. **Deploy!** 🎉

### Option 2: Deploy via CLI

```bash
npm run deploy
```

[📖 Full deployment guide](docs/DEPLOYMENT.md)

---

## 📡 API Reference

### Analyze Image

**Endpoint**: `POST /api/analyze`

**URL Analysis**:
```bash
curl -X POST https://your-domain.pages.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/image.jpg"}'
```

**File Upload**:
```bash
curl -X POST https://your-domain.pages.dev/api/analyze \
  -F "file=@image.jpg"
```

**Response**:
```json
{
  "success": true,
  "report_id": "abc123-def456",
  "redirect": "/reports/abc123-def456"
}
```

### Get Report

**Endpoint**: `GET /api/reports/:id/json`

```bash
curl https://your-domain.pages.dev/api/reports/abc123-def456/json
```

### Re-check URL

**Endpoint**: `POST /api/reports/:id/recheck`

```bash
curl -X POST https://your-domain.pages.dev/api/reports/abc123-def456/recheck
```

[📖 Full API documentation](docs/API_EXAMPLES.md)

---

## 🔒 Security & Privacy

### SSRF Protection

Blocks dangerous requests to:
- ✅ Private IP ranges (`10.x.x.x`, `192.168.x.x`, `172.16-31.x.x`)
- ✅ Localhost (`127.0.0.1`, `::1`)
- ✅ Link-local addresses (`169.254.x.x`)
- ✅ Cloud metadata endpoints (`169.254.169.254`)

### Privacy Guarantees

- **No Image Storage**: Images are never saved to disk or database
- **Auto-Redaction**: GPS coordinates and serial numbers hidden by default
- **In-Memory Processing**: Images exist only during analysis
- **User Control**: "Show Sensitive Data" toggle available

### Rate Limiting

- **10 requests/minute** per IP (configurable)
- **15MB max file size**
- **10 second timeout** per request

### Reporting Vulnerabilities

See [SECURITY.md](docs/SECURITY.md) for our security policy.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**Deployment Guide**](docs/DEPLOYMENT.md) | Step-by-step deployment to Cloudflare Pages |
| [**GitHub Actions CI/CD**](docs/GITHUB_ACTIONS.md) | Automated testing and deployment setup |
| [**Architecture Overview**](docs/ARCHITECTURE.md) | System design, data flow, components |
| [**Remote Database**](docs/DEV_REMOTE_DB.md) | Using production database locally |
| [**Contributing**](CONTRIBUTING.md) | How to contribute code |
| [**Code of Conduct**](CODE_OF_CONDUCT.md) | Community guidelines |
| [**Security Policy**](docs/SECURITY.md) | Vulnerability reporting |
| [**Changelog**](CHANGELOG.md) | Version history |
| [**API Examples**](docs/API_EXAMPLES.md) | API usage examples |

---

## 🤝 Contributing

We love contributions! Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

### Quick Contribution Flow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/awesome-feature`
3. **Commit** your changes: `git commit -m 'feat: add awesome feature'`
4. **Push** to your fork: `git push origin feature/awesome-feature`
5. **Open** a Pull Request

### Development Setup

```bash
git clone https://github.com/c2-tlhah/image-stalk.git
cd image-stalk
npm install
npm run dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📊 Database Schema

### `reports` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PRIMARY KEY | Unique report identifier |
| `input_type` | TEXT | `'url'` or `'upload'` |
| `source_url` | TEXT | Original URL (nullable) |
| `final_url` | TEXT | URL after redirects |
| `created_at` | INTEGER | Unix timestamp |
| `sha256` | TEXT | Content hash |
| `phash` | TEXT | Perceptual hash |
| `results_json` | TEXT | Full analysis (JSON) |

### `events` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PRIMARY KEY | Event identifier |
| `report_id` | TEXT FOREIGN KEY | Links to `reports.id` |
| `checked_at` | INTEGER | Recheck timestamp |
| `change_type` | TEXT | Change status |
| `sha256` | TEXT | Hash at check time |
| `results_json` | TEXT | Snapshot (JSON) |

---

## ⚠️ Limitations

### Timestamp Reliability
- EXIF timestamps can be edited by users
- HTTP headers reflect server time, not original creation
- System timestamps are when we first analyzed the image

### Analysis Accuracy
- Compression hints are algorithmic approximations
- Perceptual hashing is simplified (use dedicated library for production)
- Content analysis extracts from compressed data

### Free Tier Limits

**Cloudflare Pages**:
- 500 builds/month
- 100,000 requests/day
- Unlimited bandwidth

**Cloudflare D1**:
- 5 GB storage
- 5 million reads/day
- 100,000 writes/day

[📖 Scaling guide](docs/ARCHITECTURE.md#scaling-strategy)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License - Copyright (c) 2026 ProfileStalk Contributors
```

---

## 🙏 Acknowledgments

Built with amazing open-source tools:

- [**Remix**](https://remix.run/) - Full-stack React framework
- [**Cloudflare Pages**](https://pages.cloudflare.com/) - Edge deployment platform
- [**Cloudflare D1**](https://developers.cloudflare.com/d1/) - SQLite at the edge
- [**ExifReader**](https://github.com/mattiasw/ExifReader) - Metadata extraction
- [**Tailwind CSS**](https://tailwindcss.com/) - Utility-first CSS

Special thanks to the OSINT and digital forensics community for inspiration.

---

## 📧 Support & Community

- **🐛 Found a bug?** [Open an issue](https://github.com/c2-tlhah/image-stalk/issues/new?template=bug_report.md)
- **💡 Have an idea?** [Request a feature](https://github.com/c2-tlhah/image-stalk/issues/new?template=feature_request.md)
- **❓ Questions?** [Start a discussion](https://github.com/c2-tlhah/image-stalk/discussions)
- **💬 Chat with us?** [Join Discord](#) *(coming soon)*

---

## 🌟 Star History

If you find ProfileStalk useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=c2-tlhah/image-stalk&type=Date)](https://star-history.com/#c2-tlhah/image-stalk&Date)

---

<div align="center">

**Built with ❤️ for the OSINT and digital forensics community**

[⬆ Back to Top](#-profilestalk)

</div>
