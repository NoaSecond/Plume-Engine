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

// Thème 1 – Plume Dark (Référence AAA)
export const plumeDark: Theme = {
  name: 'plume-dark',
  displayName: 'Plume Dark',
  description: 'Le thème de référence, inspiré des moteurs AAA modernes',
  colors: {
    bg: {
      primary: '#1E1E1E',      // Anthracite profond
      secondary: '#252525',    // Panel background
      tertiary: '#2D2D2D',     // Elevated elements
      elevated: '#333333',     // Hover states
    },
    text: {
      primary: '#E8E8E8',      // Blanc cassé
      secondary: '#B8B8B8',    // Texte secondaire
      muted: '#808080',        // Texte atténué
      disabled: '#505050',     // Texte désactivé
    },
    accent: {
      primary: '#4FC3F7',      // Cyan lumineux (sélection)
      secondary: '#29B6F6',    // Bleu glacier
      hover: '#81D4FA',        // État survol
      active: '#0288D1',       // État actif
    },
    border: {
      default: '#3A3A3A',      // Bordure standard
      subtle: '#2A2A2A',       // Bordure subtile
      focus: '#4FC3F7',        // Bordure focus
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

// Thème 2 – Nebula Midnight (Sci-fi / Cyberpunk)
export const nebulaMidnight: Theme = {
  name: 'nebula-midnight',
  displayName: 'Nebula Midnight',
  description: 'Thème stylisé pour environnements sombres et écrans OLED',
  colors: {
    bg: {
      primary: '#0A0A0F',      // Noir profond
      secondary: '#12121A',    // Panel background
      tertiary: '#1A1A28',     // Elevated elements
      elevated: '#252538',     // Hover states
    },
    text: {
      primary: '#E0E0FF',      // Blanc légèrement teinté violet
      secondary: '#B8B8D8',    // Texte secondaire
      muted: '#7878A8',        // Texte atténué
      disabled: '#484860',     // Texte désactivé
    },
    accent: {
      primary: '#DA70D6',      // Magenta doux
      secondary: '#9D4EDD',    // Violet froid
      hover: '#E98EF5',        // État survol
      active: '#7B2CBF',       // État actif
    },
    border: {
      default: '#2A2A48',      // Bordure standard
      subtle: '#1A1A38',       // Bordure subtile
      focus: '#DA70D6',        // Bordure focus
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

// Thème 3 – Feather Light (Lumineux et minimaliste)
export const featherLight: Theme = {
  name: 'feather-light',
  displayName: 'Feather Light',
  description: 'Thème lumineux, minimaliste et respirant',
  colors: {
    bg: {
      primary: '#F5F5F5',      // Gris clair
      secondary: '#EBEBEB',    // Panel background
      tertiary: '#E0E0E0',     // Elevated elements
      elevated: '#D5D5D5',     // Hover states
    },
    text: {
      primary: '#1A1A1A',      // Noir profond
      secondary: '#4A4A4A',    // Texte secondaire
      muted: '#7A7A7A',        // Texte atténué
      disabled: '#AAAAAA',     // Texte désactivé
    },
    accent: {
      primary: '#64B5F6',      // Bleu pastel
      secondary: '#42A5F5',    // Bleu vif
      hover: '#90CAF9',        // État survol
      active: '#1E88E5',       // État actif
    },
    border: {
      default: '#D0D0D0',      // Bordure standard
      subtle: '#E0E0E0',       // Bordure subtile
      focus: '#64B5F6',        // Bordure focus
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
