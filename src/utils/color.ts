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
