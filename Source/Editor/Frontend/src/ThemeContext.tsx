import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeName, Theme, themes, defaultTheme } from './themes';

interface ThemeContextType {
  currentTheme: ThemeName;
  theme: Theme;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'plume-engine-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored && stored in themes) ? stored as ThemeName : defaultTheme;
  });

  const theme = themes[currentTheme];

  // Apply theme to CSS variables for global access and export to C++
  useEffect(() => {
    const root = document.documentElement;
    const t = theme.colors;
    
    // Background colors
    root.style.setProperty('--color-bg-primary', t.bg.primary);
    root.style.setProperty('--color-bg-secondary', t.bg.secondary);
    root.style.setProperty('--color-bg-tertiary', t.bg.tertiary);
    root.style.setProperty('--color-bg-elevated', t.bg.elevated);
    
    // Text colors
    root.style.setProperty('--color-text-primary', t.text.primary);
    root.style.setProperty('--color-text-secondary', t.text.secondary);
    root.style.setProperty('--color-text-muted', t.text.muted);
    root.style.setProperty('--color-text-disabled', t.text.disabled);
    
    // Accent colors
    root.style.setProperty('--color-accent-primary', t.accent.primary);
    root.style.setProperty('--color-accent-secondary', t.accent.secondary);
    root.style.setProperty('--color-accent-hover', t.accent.hover);
    root.style.setProperty('--color-accent-active', t.accent.active);
    
    // Border colors
    root.style.setProperty('--color-border-default', t.border.default);
    root.style.setProperty('--color-border-subtle', t.border.subtle);
    root.style.setProperty('--color-border-focus', t.border.focus);
    
    // Export theme data for C++ (splash screen)
    const themeData = {
      name: currentTheme,
      colors: {
        accent: {
          primary: t.accent.primary
        }
      }
    };
    
    // Make it available globally for C++ to access
    (window as any).PLUME_THEME_DATA = themeData;
    
    // Status colors
    root.style.setProperty('--color-status-success', t.status.success);
    root.style.setProperty('--color-status-warning', t.status.warning);
    root.style.setProperty('--color-status-error', t.status.error);
    root.style.setProperty('--color-status-info', t.status.info);
    
    // Viewport colors
    root.style.setProperty('--color-viewport-bg', t.viewport.background);
    root.style.setProperty('--color-viewport-grid', t.viewport.grid);
    root.style.setProperty('--color-viewport-selection', t.viewport.selection);
    
    // Shadows
    root.style.setProperty('--shadow-sm', theme.shadows.sm);
    root.style.setProperty('--shadow-md', theme.shadows.md);
    root.style.setProperty('--shadow-lg', theme.shadows.lg);
    
    // Border radius
    root.style.setProperty('--radius-sm', theme.borderRadius.sm);
    root.style.setProperty('--radius-md', theme.borderRadius.md);
    root.style.setProperty('--radius-lg', theme.borderRadius.lg);
    
    // Store in localStorage
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
  }, [theme, currentTheme]);

  const setTheme = (newTheme: ThemeName) => {
    setCurrentTheme(newTheme);
  };

  const toggleTheme = () => {
    const themeNames = Object.keys(themes) as ThemeName[];
    const currentIndex = themeNames.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    setCurrentTheme(themeNames[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
