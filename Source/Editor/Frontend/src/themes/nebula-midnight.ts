import { Theme } from './types';

// Theme 2 – Nebula Midnight (Sci-fi / Cyberpunk)
export const nebulaMidnight: Theme = {
  name: 'nebula-midnight',
  displayName: 'Nebula Midnight',
  description: 'Stylized theme for dark environments and OLED screens',
  colors: {
    bg: {
      primary: '#0A0A0F',      // Deep black
      secondary: '#12121A',    // Panel background
      tertiary: '#1A1A28',     // Elevated elements
      elevated: '#252538',     // Hover states
    },
    text: {
      primary: '#E0E0FF',      // White lightly tinted violet
      secondary: '#B8B8D8',    // Secondary text
      muted: '#7878A8',        // Muted text
      disabled: '#484860',     // Disabled text
    },
    accent: {
      primary: '#DA70D6',      // Soft magenta
      secondary: '#9D4EDD',    // Cold violet
      hover: '#E98EF5',        // Hover state
      active: '#7B2CBF',       // Active state
    },
    border: {
      default: '#2A2A48',      // Standard border
      subtle: '#1A1A38',       // Subtle border
      focus: '#DA70D6',        // Focus border
    },
    status: {
      success: '#6FFFB0',
      warning: '#FFB86C',
      error: '#FF6B6B',
      info: '#8BE9FD',
    },
    viewport: {
      background: '#080810',
      grid: '#1A1A38',
      selection: '#DA70D680',
    },
    selection: {
      background: '#DA70D630',
      border: '#DA70D6',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(138, 70, 214, 0.2)',
    md: '0 4px 6px -1px rgba(138, 70, 214, 0.25)',
    lg: '0 10px 15px -3px rgba(138, 70, 214, 0.3)',
  },
  borderRadius: {
    sm: '3px',
    md: '5px',
    lg: '8px',
  },
};

export default nebulaMidnight;
