import { Theme } from './types';

export type { Theme };
export type ThemeName = string;

// The themes are now provided dynamically by the C++ backend
// through window.PLUME_THEME_LIST and window.PLUME_THEME_DATA
export const themes: Record<string, Theme> = {};

// Default theme identifier
export let defaultTheme = 'plume-dark';

// Hardcoded fallback for safety (Reference theme)
export const fallbackTheme: Theme = {
  name: 'plume-dark',
  displayName: 'Plume Dark',
  description: 'Fallback theme',
  colors: {
    bg: { primary: '#111111', secondary: '#181818', tertiary: '#222222', elevated: '#2A2A2A' },
    text: { primary: '#E0E0E0', secondary: '#A0A0A0', muted: '#666666', disabled: '#404040' },
    accent: { primary: '#4FC3F7', secondary: '#29B6F6', hover: '#81D4FA', active: '#0288D1' },
    border: { default: '#333333', subtle: '#222222', focus: '#4FC3F7' },
    status: { success: '#4CAF50', warning: '#FFC107', error: '#F44336', info: '#2196F3' },
    viewport: { background: '#0F0F0F', grid: '#222222', selection: '#4FC3F780' },
    selection: { background: '#4FC3F730', border: '#4FC3F7' },
  },
  shadows: { sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)', md: '0 4px 6px -1px rgba(0, 0, 0, 0.3)', lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' },
  borderRadius: { sm: '2px', md: '4px', lg: '6px' }
};

themes[defaultTheme] = fallbackTheme;

/**
 * Initializes the theme system from the data injected by the C++ host
 */
export function initializeDynamicThemes(): { theme: Theme, list: any[] } {
  const dynamicList = (window as any).PLUME_THEME_LIST || [];
  const dynamicActive = (window as any).PLUME_THEME_DATA;

  // Clear existing themes to avoid duplicates on re-init
  for (const key in themes) delete themes[key];

  if (dynamicActive) {
    themes[dynamicActive.name] = dynamicActive;
    defaultTheme = dynamicActive.name;
  } else {
    // Fallback if no active theme is injected
    themes[defaultTheme] = fallbackTheme;
  }

  // Populate the themes map from the metadata list
  // Even if we don't have full data for all themes, we need them in the map
  // to be visible in the selector.
  dynamicList.forEach((t: any) => {
    if (!themes[t.name]) {
      // Create a stub if full data isn't available yet
      // The backend will re-export full data when switching
      themes[t.name] = {
        ...fallbackTheme,
        name: t.name,
        displayName: t.displayName || t.name,
        description: t.description || '',
        colors: t.colors || fallbackTheme.colors,
        shadows: t.shadows || fallbackTheme.shadows,
        borderRadius: t.borderRadius || fallbackTheme.borderRadius
      };
    }
  });

  return {
    theme: themes[defaultTheme],
    list: dynamicList
  };
}
