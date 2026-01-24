/**
 * Validates if a string is a valid HTTP/HTTPS URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL by:
 * - Trimming whitespace
 * - Adding https:// if no protocol is present
 * - Validating the result
 * 
 * Throws an error if the resulting URL is invalid
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  let normalized = trimmed;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    normalized = `https://${trimmed}`;
  }

  if (!isValidUrl(normalized)) {
    throw new Error('Invalid URL format');
  }

  return normalized;
}

/**
 * Extracts the domain from a URL, removing www. prefix
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'Link';
  }
}
