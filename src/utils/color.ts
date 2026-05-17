export function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
  const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(2.55 * percent));
  const b = Math.max(0, (num & 0x0000FF) - Math.round(2.55 * percent));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

/**
 * Convert hex to HSL components
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Returns a dark, saturated complementary color for use as text on a light badge.
 * Takes the page background hex, shifts hue by 180°, and clamps to ensure
 * readability against a white/frosted background.
 */
export function getComplementaryColor(hexBg: string): string {
  const { h } = hexToHSL(hexBg);
  const compHue = (h + 180) % 360;
  // High saturation, low lightness → vivid but dark enough to read on white
  return `hsl(${Math.round(compHue)}, 70%, 35%)`;
}

/**
 * Calculate relative luminance of a hex color
 * Based on WCAG 2.0 formula
 */
function getLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Check if a color is "light" (needs dark text for contrast)
 * Returns true if the color is light, false if dark
 */
export function isLightColor(hexColor: string): boolean {
  return getLuminance(hexColor) > 0.5;
}

/**
 * Get button styles that ensure proper contrast against an accent color
 * For light accent colors, use a dark fallback
 */
export interface ButtonStyles {
  primary: { backgroundColor: string; color: string };
  secondary: { borderColor: string; color: string; backgroundColor: string };
}

export function getButtonStyles(accentColor: string): ButtonStyles {
  const light = isLightColor(accentColor);

  if (light) {
    // Light accent color - use dark gray for primary, accent for secondary with dark text
    return {
      primary: {
        backgroundColor: '#374151', // gray-700
        color: '#ffffff',
      },
      secondary: {
        borderColor: '#6B7280', // gray-500
        color: '#374151', // gray-700
        backgroundColor: '#F3F4F6', // gray-100
      },
    };
  }

  // Dark accent color - use accent color normally
  return {
    primary: {
      backgroundColor: accentColor,
      color: '#ffffff',
    },
    secondary: {
      borderColor: accentColor,
      color: accentColor,
      backgroundColor: accentColor + '15', // 15% opacity
    },
  };
}
