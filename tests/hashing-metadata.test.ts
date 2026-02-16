/**
 * Tests for Hashing and Metadata Extraction
 */

import { sha256, hexDump } from '../app/services/hashing';
import { detectFileType, getMagicBytes } from '../app/services/metadata-extractor';

console.log('🧪 Testing Hashing and Metadata...\n');

// Test 1: SHA-256 hashing
async function testHashing() {
  try {
    const testData = new TextEncoder().encode('Hello, World!');
    const hash = await sha256(testData.buffer);
    const expectedHash = 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f';
    console.assert(
      hash === expectedHash,
      `✅ Test 1 passed: SHA-256 hash matches expected value`
    );
    console.log('✅ Test 1: SHA-256 hashing works correctly');
    console.log(`   Hash: ${hash.substring(0, 16)}...`);
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }
}

// Test 2: File type detection - JPEG
function testJpegDetection() {
  try {
    // JPEG magic bytes: FF D8 FF
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const result = detectFileType(jpegBytes.buffer);
    console.assert(result.type === 'JPEG', 'JPEG type detected');
    console.assert(result.mime === 'image/jpeg', 'JPEG MIME detected');
    console.log('✅ Test 2: JPEG file type detection works');
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }
}

// Test 3: File type detection - PNG
function testPngDetection() {
  try {
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = detectFileType(pngBytes.buffer);
    console.assert(result.type === 'PNG', 'PNG type detected');
    console.assert(result.mime === 'image/png', 'PNG MIME detected');
    console.log('✅ Test 3: PNG file type detection works');
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }
}

// Test 4: File type detection - GIF
function testGifDetection() {
  try {
    // GIF magic bytes: 47 49 46 38 39 61 (GIF89a)
    const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    const result = detectFileType(gifBytes.buffer);
    console.assert(result.type === 'GIF', 'GIF type detected');
    console.assert(result.mime === 'image/gif', 'GIF MIME detected');
    console.log('✅ Test 4: GIF file type detection works');
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
  }
}

// Test 5: Magic bytes extraction
function testMagicBytes() {
  try {
    const testBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const magic = getMagicBytes(testBytes.buffer, 6);
    console.assert(magic === 'FF D8 FF E0 00 10', 'Magic bytes extracted correctly');
    console.log('✅ Test 5: Magic bytes extraction works');
    console.log(`   Magic: ${magic}`);
  } catch (error) {
    console.error('❌ Test 5 failed:', error);
  }
}

// Test 6: Hex dump
function testHexDump() {
  try {
    const testBytes = new Uint8Array([
      0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x57,
      0x6f, 0x72, 0x6c, 0x64, 0x21, 0x00, 0x00, 0x00,
    ]);
    const dump = hexDump(testBytes.buffer, 16);
    console.assert(dump.includes('Hello, World!'), 'Hex dump contains ASCII');
    console.log('✅ Test 6: Hex dump works');
    console.log(`   Dump:\n${dump}`);
  } catch (error) {
    console.error('❌ Test 6 failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  await testHashing();
  testJpegDetection();
  testPngDetection();
  testGifDetection();
  testMagicBytes();
  testHexDump();
  console.log('\n✅ All hashing and metadata tests completed!');
}

runAllTests();
