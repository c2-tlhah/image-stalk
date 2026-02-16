
/**
 * Service to resolve profile images from social media URLs
 * Uses OpenGraph tags to find the best image
 */

import { validateSafeUrl, SSRFError } from './ssrf-protection';

export async function resolveProfileImageUrl(url: string): Promise<string | null> {
  // fast path: if it looks like an image file, return null to let normal fetcher handle it
  if (url.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
    return null;
  }

  // Validate URL first
  const validation = validateSafeUrl(url);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid URL');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout for metadata fetch
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      return null;
    }

    const html = await response.text();
    
    // Look for og:image
    // <meta property="og:image" content="https://..." />
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) || 
                         html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);

    if (ogImageMatch && ogImageMatch[1]) {
      let imageUrl = ogImageMatch[1];
      
      // Decode HTML entities if needed (simple version)
      imageUrl = imageUrl.replace(/&amp;/g, '&');
      
      // Verify it's a valid URL
      try {
        new URL(imageUrl);
        return imageUrl;
      } catch (e) {
        // partial URL? try to resolve against base
        try {
          return new URL(imageUrl, url).toString();
        } catch (e2) {
          // continue
        }
      }
    }
    
    // Twitter card image fallback
    const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i) ||
                              html.match(/<meta\s+content=["'](.*?)["']\s+name=["']twitter:image["']/i);
                              
    if (twitterImageMatch && twitterImageMatch[1]) {
       let imageUrl = twitterImageMatch[1].replace(/&amp;/g, '&');
       try { new URL(imageUrl); return imageUrl; } catch(e) {}
    }

    // JSON-LD fallback (Schema.org)
    // specific for Instagram which sometimes embeds JSON
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    if (jsonLdMatch && jsonLdMatch[1]) {
      try {
        const json = JSON.parse(jsonLdMatch[1]);
        // Look for ImageObject or Person with image
        if (json.image) {
            if (typeof json.image === 'string') return json.image;
            if (typeof json.image === 'object' && json.image.url) return json.image.url;
            if (Array.isArray(json.image) && json.image[0]) return json.image[0];
        }
        if (json['@graph']) {
            for (const item of json['@graph']) {
                if (item.image) {
                    if (typeof item.image === 'string') return item.image;
                    if (item.image.url) return item.image.url;
                }
            }
        }
      } catch (e) {
        // ignore parse error
      }
    }
    
    // Check for shared data pattern (Instagram sometimes leaves this)
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});/);
    if (sharedDataMatch && sharedDataMatch[1]) {
        try {
            const data = JSON.parse(sharedDataMatch[1]);
            // Deep dive for profile_pic_url_hd
            // This structure changes often, so this is a best-effort traversal
            // But usually User > profile_pic_url_hd
            // Implementation tricky without types, skip for now unless needed
        } catch (e) {}
    }

    return null;
  } catch (error) {
    console.error('Error resolving profile image:', error);
    return null;
  }
}
