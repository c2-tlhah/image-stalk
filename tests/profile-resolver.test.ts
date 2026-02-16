
/**
 * Tests for Profile Resolver
 */

import { resolveProfileImageUrl } from '../app/services/profile-resolver';

console.log('🧪 Testing Profile Resolver...\n');

// Mock fetch
const originalFetch = global.fetch;

// Helper to mock fetch response
function mockFetchResponse(body: string, contentType: string = 'text/html') {
  global.fetch = async () => ({
    ok: true,
    headers: {
      get: (name: string) => name.toLowerCase() === 'content-type' ? contentType : null
    },
    text: async () => body
  } as any);
}

// Restore fetch after tests
function restoreFetch() {
  global.fetch = originalFetch;
}

async function runTests() {
  try {
    // Test 1: Direct Image URL (fast path)
    console.log('Test 1: Direct Image URL');
    const result1 = await resolveProfileImageUrl('https://example.com/image.jpg');
    if (result1 === null) {
      console.log('✅ Passed: Returns null for direct image URL');
    } else {
      console.error('❌ Failed: Should return null for image extension, got', result1);
    }

    // Test 2: HTML with og:image
    console.log('\nTest 2: HTML with og:image');
    mockFetchResponse(`
      <html>
        <head>
          <meta property="og:image" content="https://example.com/profile.jpg" />
        </head>
      </html>
    `);
    const result2 = await resolveProfileImageUrl('https://instagram.com/user');
    if (result2 === 'https://example.com/profile.jpg') {
      console.log('✅ Passed: Extracted og:image correctly');
    } else {
      console.error('❌ Failed: Expected https://example.com/profile.jpg, got', result2);
    }

    // Test 3: HTML with twitter:image
    console.log('\nTest 3: HTML with twitter:image fallback');
    mockFetchResponse(`
      <html>
        <head>
          <meta name="twitter:image" content="https://example.com/twitter_profile.jpg" />
        </head>
      </html>
    `);
    const result3 = await resolveProfileImageUrl('https://twitter.com/user');
    if (result3 === 'https://example.com/twitter_profile.jpg') {
      console.log('✅ Passed: Extracted twitter:image correctly');
    } else {
      console.error('❌ Failed: Expected https://example.com/twitter_profile.jpg, got', result3);
    }
    
    // Test 4: HTML without image metadata
    console.log('\nTest 4: HTML without image metadata');
    mockFetchResponse(`<html><body>No meta here</body></html>`);
    const result4 = await resolveProfileImageUrl('https://example.com/page');
    if (result4 === null) {
      console.log('✅ Passed: Returns null when no metadata found');
    } else {
      console.error('❌ Failed: Should return null, got', result4);
    }

  } catch (err) {
    console.error('Unhandled error during tests:', err);
  } finally {
    restoreFetch();
  }
}

runTests();
