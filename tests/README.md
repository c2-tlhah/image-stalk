# Tests for ProfileImageIntel Lite

This directory contains tests for the backend services.

## Running Tests

Tests are written in TypeScript and can be run using Node.js with TypeScript execution:

```powershell
# Install dependencies first
npm install

# Run SSRF protection tests
npx tsx tests/ssrf-protection.test.ts

# Run hashing and metadata tests
npx tsx tests/hashing-metadata.test.ts
```

## Test Coverage

### SSRF Protection Tests
- Valid HTTPS URLs
- Blocking localhost
- Blocking private IP ranges (10.x, 192.168.x, 172.x)
- Blocking metadata endpoints
- Blocking file:// protocol
- Blocking URLs with embedded credentials

### Hashing Tests
- SHA-256 hash computation
- Hex dump generation

### Metadata Tests
- JPEG file type detection
- PNG file type detection
- GIF file type detection
- Magic bytes extraction

## Adding New Tests

To add new tests, create a new `.test.ts` file and follow the pattern:

```typescript
console.log('🧪 Testing Feature...\n');

// Test case
try {
  // Your test logic
  console.log('✅ Test passed');
} catch (error) {
  console.error('❌ Test failed:', error);
}
```
