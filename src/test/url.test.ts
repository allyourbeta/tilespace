import { describe, it, expect } from 'vitest';
import { isValidUrl, normalizeUrl, extractDomain } from '@/utils/url';

describe('isValidUrl', () => {
  it('returns true for valid http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('http://example.com/path')).toBe(true);
    expect(isValidUrl('http://example.com/path?query=1')).toBe(true);
  });

  it('returns true for valid https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('https://www.example.com')).toBe(true);
    expect(isValidUrl('https://sub.domain.example.com')).toBe(true);
  });

  it('returns false for invalid URLs', () => {
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('mailto:test@example.com')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });
});

describe('normalizeUrl', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeUrl('')).toBe('');
    expect(normalizeUrl('   ')).toBe('');
  });

  it('adds https:// if no protocol', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
    expect(normalizeUrl('www.example.com')).toBe('https://www.example.com');
  });

  it('preserves existing http://', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('preserves existing https://', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('trims whitespace', () => {
    expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
  });

  it('throws for invalid URLs after normalization', () => {
    expect(() => normalizeUrl('not a valid url at all')).toThrow('Invalid URL format');
  });
});

describe('extractDomain', () => {
  it('extracts domain from URL', () => {
    expect(extractDomain('https://example.com')).toBe('example.com');
    expect(extractDomain('https://example.com/path')).toBe('example.com');
  });

  it('removes www. prefix', () => {
    expect(extractDomain('https://www.example.com')).toBe('example.com');
  });

  it('handles subdomains', () => {
    expect(extractDomain('https://blog.example.com')).toBe('blog.example.com');
  });

  it('returns "Link" for invalid URLs', () => {
    expect(extractDomain('not a url')).toBe('Link');
    expect(extractDomain('')).toBe('Link');
  });
});
