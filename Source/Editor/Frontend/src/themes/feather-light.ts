import { Theme } from './types';

// Theme 3 – Feather Light (Bright and minimalist)
export const featherLight: Theme = {
  name: 'feather-light',
  displayName: 'Feather Light',
  description: 'Bright, minimalist and clean theme',
  colors: {
    bg: {
      primary: '#F5F5F5',      // Light gray
      secondary: '#EBEBEB',    // Panel background
      tertiary: '#E0E0E0',     // Elevated elements
      elevated: '#D5D5D5',     // Hover states
    },
    text: {
      primary: '#1A1A1A',      // Deep black
      secondary: '#4A4A4A',    // Secondary text
      muted: '#7A7A7A',        // Muted text
      disabled: '#AAAAAA',     // Disabled text
    },
    accent: {
      primary: '#64B5F6',      // Pastel blue
      secondary: '#42A5F5',    // Vivid blue
      hover: '#90CAF9',        // Hover state
      active: '#1E88E5',       // Active state
    },
    border: {
      default: '#D0D0D0',      // Standard border
      subtle: '#E0E0E0',       // Subtle border
      focus: '#64B5F6',        // Focus border
    },
    status: {
      success: '#66BB6A',
      warning: '#FFA726',
      error: '#EF5350',
      info: '#42A5F5',
    },
    viewport: {
      background: '#FAFAFA',
      grid: '#E0E0E0',
      selection: '#64B5F680',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.08)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.12)',
  },
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '6px',
  },
};

export default featherLight;
