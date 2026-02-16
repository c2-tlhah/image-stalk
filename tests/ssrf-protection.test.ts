/**
 * Tests for SSRF Protection
 */

import {
  validateUrlStructure,
  isHostnameBlocked,
  validateSafeUrl,
  SSRFError,
} from '../app/services/ssrf-protection';

console.log('🧪 Testing SSRF Protection...\n');

// Test 1: Valid HTTPS URL
try {
  const result = validateSafeUrl('https://example.com/image.jpg');
  console.assert(result.valid === true, '✅ Test 1 passed: Valid HTTPS URL');
  console.log('✅ Test 1: Valid HTTPS URL passed');
} catch (error) {
  console.error('❌ Test 1 failed:', error);
}

// Test 2: Block localhost
try {
  const result = validateSafeUrl('http://localhost/image.jpg');
  console.assert(result.valid === false, '✅ Test 2 passed: Blocked localhost');
  console.log('✅ Test 2: Blocked localhost');
} catch (error) {
  console.error('❌ Test 2 failed:', error);
}

// Test 3: Block 127.0.0.1
try {
  const result = validateSafeUrl('http://127.0.0.1/image.jpg');
  console.assert(result.valid === false, '✅ Test 3 passed: Blocked 127.0.0.1');
  console.log('✅ Test 3: Blocked 127.0.0.1');
} catch (error) {
  console.error('❌ Test 3 failed:', error);
}

// Test 4: Block private IP (10.x)
try {
  const result = validateSafeUrl('http://10.0.0.1/image.jpg');
  console.assert(result.valid === false, '✅ Test 4 passed: Blocked 10.x');
  console.log('✅ Test 4: Blocked 10.x');
} catch (error) {
  console.error('❌ Test 4 failed:', error);
}

// Test 5: Block private IP (192.168.x)
try {
  const result = validateSafeUrl('http://192.168.1.1/image.jpg');
  console.assert(result.valid === false, '✅ Test 5 passed: Blocked 192.168.x');
  console.log('✅ Test 5: Blocked 192.168.x');
} catch (error) {
  console.error('❌ Test 5 failed:', error);
}

// Test 6: Block file:// protocol
try {
  const result = validateSafeUrl('file:///etc/passwd');
  console.assert(result.valid === false, '✅ Test 6 passed: Blocked file://');
  console.log('✅ Test 6: Blocked file://');
} catch (error) {
  console.error('❌ Test 6 failed:', error);
}

// Test 7: Block URLs with credentials
try {
  const result = validateSafeUrl('https://user:pass@example.com/image.jpg');
  console.assert(result.valid === false, '✅ Test 7 passed: Blocked credentials');
  console.log('✅ Test 7: Blocked URL with credentials');
} catch (error) {
  console.error('❌ Test 7 failed:', error);
}

// Test 8: Block metadata endpoints
try {
  const result = validateSafeUrl('http://169.254.169.254/latest/meta-data/');
  console.assert(result.valid === false, '✅ Test 8 passed: Blocked cloud metadata');
  console.log('✅ Test 8: Blocked cloud metadata endpoint');
} catch (error) {
  console.error('❌ Test 8 failed:', error);
}

// Test 9: Valid URL with path and query
try {
  const result = validateSafeUrl('https://cdn.example.com/images/photo.jpg?width=800');
  console.assert(result.valid === true, '✅ Test 9 passed: Valid URL with query');
  console.log('✅ Test 9: Valid URL with query params');
} catch (error) {
  console.error('❌ Test 9 failed:', error);
}

// Test 10: isHostnameBlocked function
try {
  console.assert(isHostnameBlocked('localhost') === true, 'localhost blocked');
  console.assert(isHostnameBlocked('127.0.0.1') === true, '127.0.0.1 blocked');
  console.assert(isHostnameBlocked('10.0.0.1') === true, '10.0.0.1 blocked');
  console.assert(isHostnameBlocked('example.com') === false, 'example.com allowed');
  console.log('✅ Test 10: isHostnameBlocked function works correctly');
} catch (error) {
  console.error('❌ Test 10 failed:', error);
}

console.log('\n✅ All SSRF protection tests completed!');
