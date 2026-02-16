/**
 * Guide/Documentation Page
 * Explains usage and capabilities of Image Intel
 */

import { Link } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';

export const meta: MetaFunction = () => {
  return [
    { title: 'User Guide - Image Intel' },
    { name: 'description', content: 'Learn how to use Image Intel to analyze image metadata, EXIF data, and track image changes.' },
  ];
};

export default function Guide() {
  return (
    <div className="min-h-screen scanline bg-black py-6 px-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-4">
        <Link to="/" className="text-green-400 hover:text-green-300 font-mono text-sm">
          &lt; RETURN_TO_HOME
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto terminal-border bg-black p-6">
        {/* Terminal Header */}
        <div className="flex items-center space-x-3 mb-6 pb-3 border-b border-green-500">
          <div className="flex space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          </div>
          <span className="text-green-400 font-mono text-sm">
            [USER_GUIDE]
          </span>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <h1 className="text-green-400 font-mono text-2xl mb-4 terminal-glow">
              USER GUIDE
            </h1>
            <div className="text-green-300 font-mono text-sm space-y-3 leading-relaxed">
              <p>
                Image Intel is a forensic tool for analyzing image metadata, tracking changes, 
                and investigating image origins. It extracts EXIF data, GPS coordinates, camera information, 
                and more from uploaded images or URLs.
              </p>
            </div>
          </section>

          {/* How to Use */}
          <section className="border-t border-green-500/30 pt-6">
            <h2 className="text-green-400 font-mono text-xl mb-4">
              HOW TO USE
            </h2>
            <div className="space-y-4">
              <div className="bg-green-500/5 border border-green-500/30 p-4">
                <h3 className="text-green-300 font-mono text-sm font-bold mb-2">METHOD 1: URL ANALYSIS</h3>
                <ol className="text-green-300 font-mono text-xs space-y-2 list-decimal list-inside">
                  <li>Paste any image URL (direct link to .jpg, .png, etc.)</li>
                  <li>Or paste a social media profile URL (Instagram, Twitter, etc.)</li>
                  <li>Click <span className="text-yellow-400">[ANALYZE]</span></li>
                  <li>View comprehensive analysis report</li>
                  <li>Use <span className="text-yellow-400">[RE-CHECK]</span> to monitor changes over time</li>
                </ol>
              </div>

              <div className="bg-green-500/5 border border-green-500/30 p-4">
                <h3 className="text-green-300 font-mono text-sm font-bold mb-2">METHOD 2: FILE UPLOAD</h3>
                <ol className="text-green-300 font-mono text-xs space-y-2 list-decimal list-inside">
                  <li>Click <span className="text-yellow-400">[CHOOSE_FILE]</span> or drag & drop an image</li>
                  <li>Select any image file (JPEG, PNG, GIF, WebP, BMP, TIFF)</li>
                  <li>Click <span className="text-yellow-400">[ANALYZE]</span></li>
                  <li>View detailed metadata extraction</li>
                </ol>
              </div>
            </div>
          </section>

          {/* What You Get */}
          <section className="border-t border-green-500/30 pt-6">
            <h2 className="text-green-400 font-mono text-xl mb-4">
              WHAT YOU GET
            </h2>
            <div className="space-y-3">
              {[
                {
                  title: 'FILE INFORMATION',
                  items: ['File type & format', 'File size', 'Image dimensions', 'Color space & bit depth', 'Magic bytes (file signature)']
                },
                {
                  title: 'EXIF METADATA',
                  items: ['Camera make & model', 'Date & time photo was taken', 'Camera settings (ISO, aperture, shutter speed)', 'Lens information', 'Software used']
                },
                {
                  title: 'GPS LOCATION DATA',
                  items: ['Latitude & longitude coordinates', 'Altitude', 'GPS timestamp', 'Note: Only if present in original image']
                },
                {
                  title: 'CRYPTOGRAPHIC HASHES',
                  items: ['MD5, SHA-1, SHA-256, SHA-512', 'Perceptual hash (pHash)', 'Useful for tracking image duplicates']
                },
                {
                  title: 'TEMPORAL ANALYSIS',
                  items: ['EXIF capture time', 'File modification time', 'HTTP Last-Modified header (URLs)', 'Reliability scoring for each timestamp']
                },
                {
                  title: 'HTTP HEADERS (URLs only)',
                  items: ['Server information', 'CDN detection', 'Redirect chain tracking', 'Cache status']
                },
                {
                  title: 'CONTENT ANALYSIS',
                  items: ['Brightness & contrast metrics', 'Compression analysis', 'Recompression detection', 'Quality estimation']
                },
                {
                  title: 'CHANGE DETECTION (URLs)',
                  items: ['Monitor images for changes', 'Hash comparison over time', 'Change timestamp logging']
                }
              ].map((section, idx) => (
                <div key={idx} className="bg-green-500/5 border border-green-500/30 p-3">
                  <h3 className="text-green-300 font-mono text-sm font-bold mb-2">{section.title}</h3>
                  <ul className="text-green-300 font-mono text-xs space-y-1">
                    {section.items.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Limitations */}
          <section className="border-t border-green-500/30 pt-6">
            <h2 className="text-green-400 font-mono text-xl mb-4">
              IMPORTANT LIMITATIONS
            </h2>
            <div className="space-y-3">
              <div className="bg-orange-500/10 border border-orange-500/50 p-4">
                <h3 className="text-orange-400 font-mono text-sm font-bold mb-2">SOCIAL MEDIA IMAGES</h3>
                <p className="text-orange-300 font-mono text-xs leading-relaxed mb-2">
                  Platforms like Instagram, Facebook, Twitter, and TikTok automatically strip ALL metadata:
                </p>
                <ul className="text-orange-300 font-mono text-xs space-y-1">
                  <li>- No GPS coordinates</li>
                  <li>- No camera information</li>
                  <li>- No original timestamps</li>
                  <li>- No EXIF data</li>
                </ul>
                <p className="text-orange-400 font-mono text-xs mt-3">
                  You'll only get: file size, dimensions, compression info, and HTTP headers.
                </p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/50 p-4">
                <h3 className="text-orange-400 font-mono text-sm font-bold mb-2">MOBILE UPLOADS</h3>
                <p className="text-orange-300 font-mono text-xs leading-relaxed">
                  When uploading from mobile devices (iOS/Android), your operating system may strip GPS data 
                  as a privacy protection BEFORE the file reaches this analyzer. For full metadata, transfer 
                  images to desktop first.
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/50 p-4">
                <h3 className="text-yellow-400 font-mono text-sm font-bold mb-2">METADATA RELIABILITY</h3>
                <p className="text-yellow-300 font-mono text-xs leading-relaxed">
                  WARNING: EXIF data can be easily edited or removed. Timestamps and GPS coordinates should not be 
                  considered definitive proof. Use this tool for investigation, not legal evidence.
                </p>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section className="border-t border-green-500/30 pt-6">
            <h2 className="text-green-400 font-mono text-xl mb-4">
              BEST PRACTICES
            </h2>
            <div className="bg-green-500/5 border border-green-500/30 p-4">
              <ul className="text-green-300 font-mono text-xs space-y-2">
                <li><span className="text-green-400">[+]</span> Use original, unedited images for best results</li>
                <li><span className="text-green-400">[+]</span> Upload from desktop to preserve all metadata</li>
                <li><span className="text-green-400">[+]</span> Download images directly from source (not screenshots)</li>
                <li><span className="text-green-400">[+]</span> Use direct image URLs, not webpage URLs</li>
                <li><span className="text-green-400">[+]</span> Re-check URLs periodically to monitor changes</li>
                <li><span className="text-green-400">[+]</span> Export reports as JSON for record-keeping</li>
                <li><span className="text-red-400">[-]</span> Don't upload copyrighted images without permission</li>
                <li><span className="text-red-400">[-]</span> Don't expect metadata from social media images</li>
              </ul>
            </div>
          </section>

          {/* Privacy & Security */}
          <section className="border-t border-green-500/30 pt-6">
            <h2 className="text-green-400 font-mono text-xl mb-4">
              PRIVACY & SECURITY
            </h2>
            <div className="bg-green-500/5 border border-green-500/30 p-4">
              <ul className="text-green-300 font-mono text-xs space-y-2 leading-relaxed">
                <li>• Uploaded images are analyzed server-side and stored temporarily</li>
                <li>• Analysis reports are stored in database for re-access</li>
                <li>• GPS coordinates are marked as "sensitive" and hidden by default</li>
                <li>• Use <span className="text-yellow-400">[SHOW_SENSITIVE]</span> button to reveal location data</li>
                <li>• No images are shared publicly or with third parties</li>
                <li>• URL analysis uses SSRF protection to prevent abuse</li>
                <li>• Rate limiting protects against spam and overuse</li>
              </ul>
            </div>
          </section>

          {/* Supported Formats */}
          <section className="border-t border-green-500/30 pt-6">
            <h2 className="text-green-400 font-mono text-xl mb-4">
              SUPPORTED FORMATS
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/5 border border-green-500/30 p-3">
                <h3 className="text-green-300 font-mono text-sm font-bold mb-2">IMAGE FORMATS</h3>
                <ul className="text-green-300 font-mono text-xs space-y-1">
                  <li>+ JPEG / JPG</li>
                  <li>+ PNG</li>
                  <li>+ GIF</li>
                  <li>+ WebP</li>
                  <li>+ BMP</li>
                  <li>+ TIFF</li>
                </ul>
              </div>
              <div className="bg-green-500/5 border border-green-500/30 p-3">
                <h3 className="text-green-300 font-mono text-sm font-bold mb-2">MAX FILE SIZE</h3>
                <p className="text-green-300 font-mono text-xs">
                  15 MB per file (configurable by administrator)
                </p>
                <h3 className="text-green-300 font-mono text-sm font-bold mb-2 mt-3">RATE LIMITS</h3>
                <p className="text-green-300 font-mono text-xs">
                  10 requests per minute per IP
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="border-t border-green-500/30 pt-6">
            <h2 className="text-green-400 font-mono text-xl mb-4">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <div className="space-y-3">
              {[
                {
                  q: "Why do Instagram images show no GPS data?",
                  a: "Instagram and other social media platforms strip ALL metadata (GPS, EXIF, timestamps) for privacy and performance. This is intentional and cannot be bypassed."
                },
                {
                  q: "Can I track if someone changes their profile picture?",
                  a: "Yes! Use URL analysis and click [RE-CHECK] periodically. The tool will detect if the image hash changes, indicating the picture was updated."
                },
                {
                  q: "Why is my mobile upload missing GPS data?",
                  a: "iOS and Android strip GPS data when you select images from your photo gallery for privacy. Transfer the file to desktop or use the camera directly."
                },
                {
                  q: "Is EXIF data reliable as evidence?",
                  a: "No. EXIF data can be easily edited with free tools. Use it for investigation leads, not court evidence."
                },
                {
                  q: "What's the difference between pHash and SHA-256?",
                  a: "SHA-256 changes completely if even 1 pixel changes. pHash detects similar/duplicated images even if slightly edited or compressed."
                },
                {
                  q: "Can I analyze multiple images at once?",
                  a: "Currently no. Analyze images one at a time."
                }
              ].map((faq, idx) => (
                <div key={idx} className="bg-green-500/5 border border-green-500/30 p-3">
                  <h3 className="text-green-400 font-mono text-xs font-bold mb-1">Q: {faq.q}</h3>
                  <p className="text-green-300 font-mono text-xs leading-relaxed">A: {faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <section className="border-t border-green-500/30 pt-6">
            <div className="text-center">
              <Link 
                to="/" 
                className="inline-block terminal-button px-6 py-2 text-sm"
              >
                [START_ANALYZING]
              </Link>
              <p className="text-green-600 font-mono text-xs mt-4">
                &gt; Need help? Check the console logs for diagnostic information.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto mt-4 text-center text-green-600 font-mono text-xs">
        <p>&gt; END OF GUIDE</p>
      </div>
    </div>
  );
}
