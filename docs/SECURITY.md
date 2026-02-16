# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **[YOUR_EMAIL@example.com]**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information:

- **Type of vulnerability** (e.g., SSRF bypass, XSS, SQL injection)
- **Full paths of source files** related to the vulnerability
- **Location of affected code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact** of the vulnerability
- **Suggested fix** (if you have one)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Regular updates**: At least once per week
- **Patch timeline**: Within 90 days (for critical issues, much faster)
- **Credit**: You'll be credited in the security advisory unless you prefer to remain anonymous

## Security Measures

### Current Protections

1. **SSRF Protection**
   - IP allowlist/blocklist validation
   - Private IP range blocking
   - Metadata service blocking
   - Redirect validation

2. **Input Validation**
   - URL format validation
   - File size limits (15MB)
   - File type validation (images only)
   - Content-Type verification

3. **Rate Limiting**
   - Configurable request limits
   - Per-IP tracking
   - Timeout configurations

4. **Privacy Protection**
   - GPS coordinates redacted by default
   - Serial numbers redacted
   - Camera owner info redacted
   - No server-side image storage (except temporary analysis)

5. **Database Security**
   - Cloudflare D1 managed security
   - No direct database exposure
   - Prepared statements (SQL injection prevention)

### Known Limitations

1. **Image Processing**: We use `fetch()` API which has certain limitations with large files
2. **Rate Limiting**: Basic implementation, may need enhancement for production scale
3. **Authentication**: Currently no user authentication (single-tenant design)

## Best Practices for Contributors

When contributing code, please:

1. **Validate all inputs** from users and external sources
2. **Use TypeScript** strict mode for type safety
3. **Avoid eval()** and similar code execution
4. **Sanitize data** before displaying in UI
5. **Review dependencies** for known vulnerabilities
6. **Test SSRF protection** when modifying URL fetching
7. **Use environment variables** for sensitive configuration

## Security-Related Configuration

### Environment Variables

```toml
MAX_FILE_SIZE_MB = "15"        # Prevent DoS via large files
REQUEST_TIMEOUT_MS = "10000"   # Prevent hanging requests
RATE_LIMIT_PER_MINUTE = "10"   # Basic DDoS protection
```

### SSRF Protection

The following are blocked:
- Private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- Localhost (127.0.0.0/8, ::1)
- Link-local (169.254.0.0/16, fe80::/10)
- Cloud metadata services (169.254.169.254)
- IPv6 private ranges

## Disclosure Policy

When we receive a security bug report, we will:

1. **Confirm the issue** and determine affected versions
2. **Develop a fix** for all supported versions
3. **Prepare a security advisory** (coordinated with reporter)
4. **Release patched versions** to npm/GitHub
5. **Publish the advisory** with credit to reporter

## Security Updates

Subscribe to security updates:

- **GitHub**: Watch this repository for security advisories
- **Email**: [Security mailing list link if available]
- **RSS**: GitHub releases feed

## Bug Bounty

We currently do not have a bug bounty program, but we deeply appreciate responsible disclosure and will publicly credit researchers who report valid security issues.

---

**Thank you for helping keep ProfileStalk and our users safe!**
