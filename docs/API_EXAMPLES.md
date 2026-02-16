# API Usage Examples

This document provides examples of how to use the Image Intel API programmatically.

## Base URL

```
Production: https://your-app.pages.dev
Local Dev:  http://localhost:5173
```

## Authentication

Currently, no authentication is required. Rate limiting is enforced per IP address.

---

## Examples

### 1. Analyze Image by URL (JavaScript/Fetch)

```javascript
async function analyzeImageUrl(imageUrl) {
  const response = await fetch('https://your-app.pages.dev/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: imageUrl,
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Report ID:', data.report_id);
    console.log('View report at:', data.redirect);
    return data.report_id;
  } else {
    console.error('Analysis failed:', data.error);
    throw new Error(data.error);
  }
}

// Usage
analyzeImageUrl('https://example.com/image.jpg')
  .then(reportId => console.log('Done!', reportId))
  .catch(err => console.error(err));
```

### 2. Analyze Image by Upload (JavaScript/FormData)

```javascript
async function analyzeImageFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('https://your-app.pages.dev/api/analyze', {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.report_id;
  } else {
    throw new Error(data.error);
  }
}

// Usage with file input
document.querySelector('#file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const reportId = await analyzeImageFile(file);
    window.location.href = `/reports/${reportId}`;
  }
});
```

### 3. Get Report Data (JSON)

```javascript
async function getReportData(reportId) {
  const response = await fetch(`https://your-app.pages.dev/api/reports/${reportId}/json`);
  const data = await response.json();
  
  if (data.success) {
    return {
      report: data.report,
      results: data.results,
      events: data.events,
    };
  } else {
    throw new Error(data.error);
  }
}

// Usage
getReportData('1234567890-abc123')
  .then(data => {
    console.log('File Type:', data.results.metadata.file.type);
    console.log('Dimensions:', data.results.metadata.dimensions);
    console.log('SHA-256:', data.results.hashes.sha256);
  });
```

### 4. Re-check URL

```javascript
async function recheckReport(reportId) {
  const response = await fetch(`https://your-app.pages.dev/api/reports/${reportId}/recheck`, {
    method: 'POST',
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Change Type:', data.change_type);
    console.log('Changed:', data.changed);
    console.log('Previous Hash:', data.previous_sha256);
    console.log('Current Hash:', data.current_sha256);
    return data;
  } else {
    throw new Error(data.error);
  }
}

// Usage
recheckReport('1234567890-abc123')
  .then(result => {
    if (result.changed) {
      alert('Image has changed!');
    } else {
      alert('Image is unchanged');
    }
  });
```

---

## Python Examples

### Analyze Image by URL

```python
import requests

def analyze_image_url(image_url):
    response = requests.post(
        'https://your-app.pages.dev/api/analyze',
        json={'url': image_url}
    )
    
    data = response.json()
    
    if data['success']:
        print(f"Report ID: {data['report_id']}")
        print(f"View report at: {data['redirect']}")
        return data['report_id']
    else:
        raise Exception(data['error'])

# Usage
report_id = analyze_image_url('https://example.com/image.jpg')
```

### Analyze Image by Upload

```python
import requests

def analyze_image_file(file_path):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(
            'https://your-app.pages.dev/api/analyze',
            files=files
        )
    
    data = response.json()
    
    if data['success']:
        return data['report_id']
    else:
        raise Exception(data['error'])

# Usage
report_id = analyze_image_file('path/to/image.jpg')
```

### Get Report Data

```python
import requests
import json

def get_report_data(report_id):
    response = requests.get(
        f'https://your-app.pages.dev/api/reports/{report_id}/json'
    )
    
    data = response.json()
    
    if data['success']:
        return data
    else:
        raise Exception(data['error'])

# Usage
report = get_report_data('1234567890-abc123')
print(json.dumps(report['results']['metadata'], indent=2))
```

---

## cURL Examples

### Analyze Image by URL

```bash
curl -X POST https://your-app.pages.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/image.jpg"}'
```

### Analyze Image by Upload

```bash
curl -X POST https://your-app.pages.dev/api/analyze \
  -F "file=@/path/to/image.jpg"
```

### Get Report Data

```bash
curl https://your-app.pages.dev/api/reports/1234567890-abc123/json
```

### Re-check URL

```bash
curl -X POST https://your-app.pages.dev/api/reports/1234567890-abc123/recheck
```

---

## Response Formats

### Analyze Response

```json
{
  "success": true,
  "report_id": "1234567890-abc123",
  "redirect": "/reports/1234567890-abc123"
}
```

### Error Response

```json
{
  "success": false,
  "error": "File too large. Maximum size: 15MB"
}
```

### Report JSON Response (abbreviated)

```json
{
  "success": true,
  "report": {
    "id": "1234567890-abc123",
    "input_type": "url",
    "source_url": "https://example.com/image.jpg",
    "created_at": 1708099200000
  },
  "results": {
    "metadata": {
      "file": {
        "type": "JPEG",
        "mime": "image/jpeg",
        "size": 524288
      },
      "dimensions": {
        "width": 1920,
        "height": 1080
      }
    },
    "hashes": {
      "sha256": "abc123...",
      "sha1": "def456...",
      "md5": "ghi789..."
    },
    "time_signals": {
      "exif_capture_time": {
        "iso_value": "2023-12-25T10:30:00Z",
        "confidence_score": 60
      }
    }
  },
  "events": []
}
```

---

## Rate Limiting

The API enforces rate limiting per IP address. Default: **10 requests per minute**.

**Response when rate limited:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later."
}
```
**HTTP Status:** 429 Too Many Requests

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 404 | Report Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

---

## Best Practices

1. **Handle errors gracefully**: Always check the `success` field in responses
2. **Respect rate limits**: Add delays between requests if processing multiple images
3. **Cache report data**: Store report IDs to avoid re-analyzing the same image
4. **Validate inputs**: Check file sizes and types before uploading
5. **Use HTTPS**: Always use HTTPS for production API calls

---

## Integration Example: Automated Monitoring Script

```javascript
// monitor-image.js - Check if an image changes over time
const fetch = require('node-fetch');

async function monitorImage(imageUrl, intervalMinutes = 60) {
  console.log(`Monitoring: ${imageUrl}`);
  
  // Initial analysis
  const response = await fetch('https://your-app.pages.dev/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl }),
  });
  
  const { report_id } = await response.json();
  console.log(`Initial report: ${report_id}`);
  
  // Check periodically
  setInterval(async () => {
    try {
      const recheckResponse = await fetch(
        `https://your-app.pages.dev/api/reports/${report_id}/recheck`,
        { method: 'POST' }
      );
      
      const result = await recheckResponse.json();
      
      if (result.changed) {
        console.log(`⚠️  Image changed! Type: ${result.change_type}`);
        // Send alert (email, webhook, etc.)
      } else {
        console.log('✓ Image unchanged');
      }
    } catch (error) {
      console.error('Recheck failed:', error);
    }
  }, intervalMinutes * 60 * 1000);
}

// Usage
monitorImage('https://example.com/profile.jpg', 60);
```

---

For more examples and updates, see the [GitHub repository](https://github.com/c2-tlhah/image-stalk).
