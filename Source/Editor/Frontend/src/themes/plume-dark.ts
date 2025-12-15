import { Theme } from './types';

// Theme 1 – Plume Dark (AAA Reference)
export const plumeDark: Theme = {
  name: 'plume-dark',
  displayName: 'Plume Dark',
  description: 'The reference theme, inspired by modern AAA engines',
  colors: {
    bg: {
      primary: '#1E1E1E',      // Deep anthracite
      secondary: '#252525',    // Panel background
      tertiary: '#2D2D2D',     // Elevated elements
      elevated: '#333333',     // Hover states
    },
    text: {
      primary: '#E8E8E8',      // Off-white
      secondary: '#B8B8B8',    // Secondary text
      muted: '#808080',        // Muted text
      disabled: '#505050',     // Disabled text
    },
    accent: {
      primary: '#4FC3F7',      // Bright cyan (selection)
      secondary: '#29B6F6',    // Glacier blue
      hover: '#81D4FA',        // Hover state
      active: '#0288D1',       // Active state
    },
    border: {
      default: '#3A3A3A',      // Standard border
      subtle: '#2A2A2A',       // Subtle border
      focus: '#4FC3F7',        // Focus border
    },
    status: {
      success: '#4CAF50',
      warning: '#FFC107',
      error: '#F44336',
      info: '#2196F3',
    },
    viewport: {
      background: '#1A1A1A',
      grid: '#2A2A2A',
      selection: '#4FC3F780',
    },
    selection: {
      background: '#4FC3F730',
      border: '#4FC3F7',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
  },
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '6px',
  },
};

export default plumeDark;
