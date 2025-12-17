// Plume Engine Theme System
// Three official themes following the specifications

export type ThemeName = 'plume-dark' | 'nebula-midnight' | 'feather-light';

export interface Theme {
  name: ThemeName;
  displayName: string;
  description: string;
  colors: {
    // Background colors
    bg: {
      primary: string;
      secondary: string;
      tertiary: string;
      elevated: string;
    };
    // Text colors
    text: {
      primary: string;
      secondary: string;
      muted: string;
      disabled: string;
    };
    // Accent colors
    accent: {
      primary: string;
      secondary: string;
      hover: string;
      active: string;
    };
    // Border colors
    border: {
      default: string;
      subtle: string;
      focus: string;
    };
    // Status colors
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    // Viewport/Scene colors
    viewport: {
      background: string;
      grid: string;
      selection: string;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

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

export const themes: Record<ThemeName, Theme> = {
  'plume-dark': plumeDark,
  'nebula-midnight': nebulaMidnight,
  'feather-light': featherLight,
};

export const defaultTheme: ThemeName = 'plume-dark';
