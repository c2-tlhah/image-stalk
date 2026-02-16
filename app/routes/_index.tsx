/**
 * Home Page
 * Allows users to analyze images by URL or upload
 */

import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';

export const meta: MetaFunction = () => {
  return [
    { title: 'ProfileImageIntel Lite - Image Forensics & Metadata Analysis' },
    {
      name: 'description',
      content:
        'Analyze image metadata, extract EXIF data, and investigate image origins with our free forensics tool.',
    },
  ];
};

export default function Index() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json() as { success: boolean; redirect?: string; error?: string };
      
      if (data.success && data.redirect) {
        navigate(data.redirect);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Generate client-side preview for the file if possible
      try {
        if (file.type.startsWith('image/')) {
          const previewUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              // If image is small enough, use it directly
              if (result.length < 500000) { // 500KB
                 resolve(result);
                 return;
              }
              
              // Otherwise resize it using canvas
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                // Calculate new dimensions (max 600px width/height)
                const MAX_SIZE = 600;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                  if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                  }
                } else {
                  if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                  }
                }
                
              canvas.width = Math.round(width);
              canvas.height = Math.round(height);
              img.crossOrigin = "anonymous";
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.drawImage(img, 0, 0, Math.round(width), Math.round(height));
                  // Compress to JPEG 70% quality
                  resolve(canvas.toDataURL('image/jpeg', 0.7));
              } else {
                  resolve("");
              }
            };
            img.onerror = () => resolve("");
            img.src = result;
          };
          reader.readAsDataURL(file);
        });
        
        if (previewUrl) {
          formData.append('preview_image', previewUrl);
        }
      }
      } catch (previewError) {
        console.error('Client-side preview generation failed:', previewError);
        // Continue without preview
      }
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json() as { success: boolean; redirect?: string; error?: string };
      
      if (data.success && data.redirect) {
        navigate(data.redirect);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please drop an image file');
      }
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };
  
  return (
    <div className="min-h-screen scanline py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* ASCII Art Header */}
        <div className="text-center mb-8 terminal-glow">
          <pre className="text-green-400 text-xs sm:text-sm leading-tight mb-4 glitch">
{`
 _____ _____ _____ _____ _____ __    _____        _____ _____ _____ _____ __    
|  _  | __  |     |   __|     |  |  |   __|___  _|     |   | |_   _|   __|  |   
|   __|    -|  |  |   __|-   -|  |__|   __|___|_||-   -| | | | | | |   __|  |__ 
|__|  |__|__|_____|__|  |_____|_____|_____|       |_____|_|___| |_| |_____|_____|
                                   L I T E
`}
          </pre>
          <p className="text-green-300 text-sm tracking-wider">
            &gt; IMAGE FORENSICS AND METADATA EXTRACTION SYSTEM
          </p>
        </div>

        {/* Main Terminal Window */}
        <div className="terminal-border bg-black p-6 mb-8">
          <div className="flex items-center mb-4 pb-2 border-b border-green-500">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="ml-4 text-green-400 text-sm font-mono">
              [FORENSICS-TERMINAL v1.0]
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-green-500/30 mb-6">
            <button
              onClick={() => setActiveTab("url")}
              className={`px-6 py-2 font-mono transition-colors ${
                activeTab === "url"
                  ? "text-green-400 border-b-2 border-green-400 bg-green-500/10"
                  : "text-green-600 hover:text-green-400"
              }`}
            >
              [URL_ANALYSIS]
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-6 py-2 font-mono transition-colors ${
                activeTab === "upload"
                  ? "text-green-400 border-b-2 border-green-400 bg-green-500/10"
                  : "text-green-600 hover:text-green-400"
              }`}
            >
              [FILE_UPLOAD]
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 border-2 border-red-500 bg-red-500/10 text-red-400 font-mono text-sm">
              <span className="text-red-500 font-bold">ERROR:</span> {error}
            </div>
          )}

          {/* URL Analysis Form */}
          {activeTab === "url" ? (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label htmlFor="url-input" className="block text-sm font-mono text-green-400 mb-2">
                  &gt; ENTER TARGET IMAGE URL OR PROFILE LINK:
                </label>
                <input
                  type="url"
                  id="url-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg OR https://instagram.com/user"
                  className="w-full terminal-input font-mono"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-green-600 font-mono mt-1">&gt; Must be publicly accessible</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full terminal-button font-mono font-bold"
              >
                {loading ? "[ANALYZING...] █" : "[INITIATE_SCAN]"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleFileSubmit} className="space-y-4">
              <div
                className={`border-2 border-dashed rounded p-8 text-center transition-all ${
                  dragActive
                    ? "border-green-300 bg-green-500/20"
                    : "border-green-500 hover:border-green-400 hover:bg-green-500/5"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-input"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <div className="text-green-400 font-mono">
                    {file ? (
                      <>
                        <p className="text-sm mb-2">&gt; FILE SELECTED:</p>
                        <p className="text-green-300 font-bold">{file.name}</p>
                        <p className="text-xs text-green-600 mt-2">
                          [{(file.size / 1024).toFixed(2)} KB]
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFile(null);
                          }}
                          className="mt-3 text-xs text-red-400 hover:text-red-300 border border-red-500 px-3 py-1"
                        >
                          [REMOVE]
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="mb-2 text-lg">[ DROP FILE HERE ]</p>
                        <p className="text-sm text-green-600">or click to browse</p>
                        <p className="text-xs text-green-600 mt-2">
                          SUPPORTED: JPG | PNG | GIF | WEBP (max 15MB)
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </div>
              <button
                type="submit"
                disabled={!file || loading}
                className="w-full terminal-button font-mono font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? "[ANALYZING...] █" : "[INITIATE_SCAN]"}
              </button>
            </form>
          )}
        </div>

        {/* Info Panel */}
        <div className="terminal-border bg-black p-4 mb-6">
          <div className="text-green-400 font-mono text-xs space-y-1">
            <p>&gt; CAPABILITIES:</p>
            <p className="text-green-500 pl-4">• EXIF/IPTC/XMP metadata extraction</p>
            <p className="text-green-500 pl-4">• HTTP header analysis (URL mode)</p>
            <p className="text-green-500 pl-4">• SHA-256/SHA-1 content hashing</p>
            <p className="text-green-500 pl-4">• Color palette & compression detection</p>
            <p className="text-yellow-400 pl-4">• GPS data REDACTED by default</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-green-600 font-mono text-xs space-y-2">
          <p>&gt; ZERO-COST TIER | NO AUTHENTICATION REQUIRED</p>
          <p>&gt; IMAGES NOT STORED | ONLY METADATA RETAINED</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <a
              href="https://github.com/c2-tlhah/image-stalk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-green-500 text-green-400 hover:bg-green-500/10 hover:text-green-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span>[STAR ON GITHUB]</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
