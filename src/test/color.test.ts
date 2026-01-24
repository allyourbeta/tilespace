import { describe, it, expect } from 'vitest';
import { isLightColor, getButtonStyles } from '@/utils/color';

describe('isLightColor', () => {
  it('returns true for white', () => {
    expect(isLightColor('#FFFFFF')).toBe(true);
    expect(isLightColor('#ffffff')).toBe(true);
  });

  it('returns false for black', () => {
    expect(isLightColor('#000000')).toBe(false);
  });

  it('returns true for light colors', () => {
    expect(isLightColor('#F5F5F5')).toBe(true); // light gray
    expect(isLightColor('#FFFFE0')).toBe(true); // light yellow
    expect(isLightColor('#E8B4B8')).toBe(true); // dusty rose background
  });

  it('returns false for dark colors', () => {
    expect(isLightColor('#333333')).toBe(false); // dark gray
    expect(isLightColor('#0891B2')).toBe(false); // ocean bold background
    expect(isLightColor('#1D4ED8')).toBe(false); // cobalt background
  });
});

describe('getButtonStyles', () => {
  it('returns dark styles for light accent colors', () => {
    const styles = getButtonStyles('#FFFFFF');
    expect(styles.primary.backgroundColor).toBe('#374151'); // gray-700
    expect(styles.primary.color).toBe('#ffffff');
  });

  it('returns accent-based styles for dark accent colors', () => {
    const accent = '#0891B2';
    const styles = getButtonStyles(accent);
    expect(styles.primary.backgroundColor).toBe(accent);
    expect(styles.primary.color).toBe('#ffffff');
    expect(styles.secondary.borderColor).toBe(accent);
    expect(styles.secondary.color).toBe(accent);
  });

  it('secondary style has transparent background with opacity', () => {
    const accent = '#0891B2';
    const styles = getButtonStyles(accent);
    expect(styles.secondary.backgroundColor).toBe(accent + '15');
  });
});
