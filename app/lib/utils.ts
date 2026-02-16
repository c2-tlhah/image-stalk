/**
 * Utility functions for the frontend
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formats a Unix timestamp to a readable date/time
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats ISO date string to readable format in user's local timezone
 * EXIF dates are stored as local time (without timezone) and displayed as-is
 * System dates are also stored in local format for consistency
 */
export function formatISODate(isoString: string | null): string {
  if (!isoString) return 'N/A';
  
  try {
    // Parse the ISO string manually to display in user's timezone
    // Format: "2024-02-16T00:30:00" (no Z = local time)
    const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    
    if (match) {
      const [_, year, month, day, hour, minute, second] = match;
      
      // Create a date display - treat as user's local time
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[parseInt(month) - 1];
      
      // Convert to 12-hour format
      const hourNum = parseInt(hour);
      const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      
      return `${monthName} ${parseInt(day)}, ${year}, ${hour12.toString().padStart(2, '0')}:${minute}:${second} ${ampm}`;
    }
    
    // Fallback: if it has a Z (UTC), convert to user's timezone
    const date = new Date(isoString);
    
    if (!isNaN(date.getTime())) {
      // Use toLocaleString which automatically converts to user's timezone
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }
    
    return isoString;
  } catch {
    return isoString;
  }
}

/**
 * Truncates a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Downloads text as a file
 */
export function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Returns confidence color class
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-green-600';
  if (confidence >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Returns confidence badge color
 */
export function getConfidenceBadgeColor(confidence: number): string {
  if (confidence >= 80) return 'bg-green-100 text-green-800';
  if (confidence >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}
