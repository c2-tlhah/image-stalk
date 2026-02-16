# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of ProfileStalk
- URL-based image analysis
- File upload analysis (up to 15MB)
- EXIF/IPTC/XMP metadata extraction
- HTTP header analysis
- Content hashing (SHA-256, SHA-1, pHash)
- Time signal analysis with confidence scoring
- Image preview proxy for external sources
- Change tracking for URL-based images
- Privacy-first redaction (GPS, serial numbers)
- Terminal/hacker-themed UI
- Brightness and contrast analysis
- Cloudflare D1 database integration
- Remote database support for local development

### Features
- **Zero-cost deployment** on Cloudflare Pages free tier
- **SSRF protection** for safe URL fetching
- **Smart rate limiting** (configurable)
- **Responsive design** with mobile support
- **Perceptual hashing** for duplicate detection
- **Multi-source time analysis** (EXIF, HTTP headers, system)
- **Browser-like headers** for CDN compatibility (Instagram, Facebook, etc.)

### Documentation
- Comprehensive README with setup guide
- Deployment guide for Cloudflare Pages
- Remote database development guide
- Contributing guidelines
- Code of conduct
- Security policy
- MIT License

## [1.0.0] - 2026-02-16

### Initial Release
🎉 First public release of ProfileStalk - Zero-cost image forensics tool

---

## Release Types

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes
