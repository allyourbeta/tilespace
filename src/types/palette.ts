export interface Palette {
  id: string;
  name: string;
  category: 'vibrant' | 'muted';
  background: string;
  border: string;
  colors: string[];
}

export const PALETTES: Palette[] = [
  {
    id: 'coral-reef',
    name: 'Coral Reef',
    category: 'vibrant',
    background: '#FF6B5B',
    border: '#0D7377',
    colors: [
      '#FF6B5B', '#FF8A7A', '#0D7377', '#14A3A8',
      '#32C4C0', '#FF9F8A', '#1E8E91', '#4DD4CF',
      '#FFC1B5', '#66E0DC', '#FF7A6A', '#26A5A8'
    ]
  },
  {
    id: 'ocean-bold',
    name: 'Ocean Bold',
    category: 'vibrant',
    background: '#0891B2',
    border: '#F97316',
    colors: [
      '#0891B2', '#06B6D4', '#22D3EE', '#F97316',
      '#FB923C', '#FDBA74', '#0E7490', '#67E8F9',
      '#EA580C', '#155E75', '#A5F3FC', '#FFEDD5'
    ]
  },
  {
    id: 'sunset-glow',
    name: 'Sunset',
    category: 'vibrant',
    background: '#F97316',
    border: '#7F1D1D',
    colors: [
      '#F97316', '#FB923C', '#FDBA74', '#7F1D1D',
      '#991B1B', '#B91C1C', '#EA580C', '#FED7AA',
      '#DC2626', '#C2410C', '#FECACA', '#FEF3C7'
    ]
  },
  {
    id: 'emerald',
    name: 'Emerald',
    category: 'vibrant',
    background: '#047857',
    border: '#CA8A04',
    colors: [
      '#047857', '#059669', '#10B981', '#CA8A04',
      '#EAB308', '#FACC15', '#065F46', '#34D399',
      '#D97706', '#064E3B', '#6EE7B7', '#FEF08A'
    ]
  },
  {
    id: 'berry-pop',
    name: 'Berry',
    category: 'vibrant',
    background: '#BE185D',
    border: '#D97706',
    colors: [
      '#BE185D', '#DB2777', '#EC4899', '#D97706',
      '#F59E0B', '#FBBF24', '#9D174D', '#F472B6',
      '#EA580C', '#831843', '#FBCFE8', '#FDE68A'
    ]
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    category: 'vibrant',
    background: '#1D4ED8',
    border: '#C2410C',
    colors: [
      '#1D4ED8', '#2563EB', '#3B82F6', '#C2410C',
      '#EA580C', '#F97316', '#1E40AF', '#60A5FA',
      '#DC2626', '#1E3A8A', '#93C5FD', '#FFEDD5'
    ]
  },
  {
    id: 'sage-clay',
    name: 'Sage & Clay',
    category: 'muted',
    background: '#A3B18A',
    border: '#BC6C25',
    colors: [
      '#A3B18A', '#B5C49C', '#C7D7AE', '#BC6C25',
      '#D4915F', '#DDA15E', '#8B9F6F', '#DAE4C8',
      '#E9C46A', '#6B7F54', '#ECF0E3', '#FEFAE0'
    ]
  },
  {
    id: 'dusty-rose',
    name: 'Dusty Rose',
    category: 'muted',
    background: '#E8B4B8',
    border: '#A26769',
    colors: [
      '#E8B4B8', '#F0C8CB', '#F5D5D7', '#A26769',
      '#B87D7F', '#C99495', '#D9A0A3', '#EFD5D7',
      '#8B5658', '#FAE5E7', '#F8DCDE', '#C4A0A2'
    ]
  },
  {
    id: 'ocean-mist',
    name: 'Ocean Mist',
    category: 'muted',
    background: '#B8C5D6',
    border: '#5A6F7E',
    colors: [
      '#B8C5D6', '#C8D3E1', '#D8E1EC', '#5A6F7E',
      '#6E8394', '#8297AA', '#A4B5C8', '#E4EAF2',
      '#47596A', '#F0F4F8', '#D0DCE8', '#96ABC0'
    ]
  },
  {
    id: 'sand-dune',
    name: 'Sand Dune',
    category: 'muted',
    background: '#D5C4A1',
    border: '#5D4E37',
    colors: [
      '#D5C4A1', '#E2D4B8', '#EFE4CF', '#5D4E37',
      '#7A6B52', '#97886D', '#C1AE8B', '#F5EDE0',
      '#4A3E2C', '#FAF6F0', '#E9DCC8', '#B4A488'
    ]
  },
  {
    id: 'lavender',
    name: 'Lavender',
    category: 'muted',
    background: '#C4B7D2',
    border: '#6B5B7A',
    colors: [
      '#C4B7D2', '#D4C9E2', '#E4DBF2', '#6B5B7A',
      '#7F7090', '#9485A6', '#B3A5C4', '#EFE8F8',
      '#574867', '#F8F5FC', '#DDD2EC', '#A899BC'
    ]
  },
  {
    id: 'nordic',
    name: 'Nordic',
    category: 'muted',
    background: '#F5F1EB',
    border: '#3D7A7A',
    colors: [
      '#F5F1EB', '#EAE4DC', '#DFD7CD', '#3D7A7A',
      '#4D9494', '#5DAEAE', '#E8E2DA', '#D4CCC2',
      '#2D6A6A', '#C9C1B7', '#B8AEA4', '#6DC8C8'
    ]
  }
];

export const DEFAULT_PALETTE_ID = 'ocean-bold';

export function getPalette(paletteId: string): Palette {
  return PALETTES.find(p => p.id === paletteId) ?? PALETTES.find(p => p.id === DEFAULT_PALETTE_ID)!;
}

export function getColorFromPalette(paletteId: string, colorIndex: number): string {
  const palette = getPalette(paletteId);
  return palette.colors[colorIndex % palette.colors.length];
}
