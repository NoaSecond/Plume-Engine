import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeName, Theme, themes, defaultTheme, initializeDynamicThemes } from './themes/index';

interface ThemeContextType {
  currentTheme: ThemeName;
  theme: Theme;
  themeList: any[];
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'plume-engine-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Ensure the 'themes' object is populated from injected data
  const initial = initializeDynamicThemes();

  // Source of truth comes from window.PLUME_THEME_DATA (injected by C++)
  const [theme, setThemeState] = useState<Theme>(() => {
    return initial.theme || themes[defaultTheme];
  });

  const [themeList, setThemeList] = useState<any[]>(() => {
    return (window as any).PLUME_THEME_LIST || [];
  });

  // Re-sync if window data changes (e.g. after a refresh or manual injection)
  useEffect(() => {
    const handleSync = () => {
      if ((window as any).PLUME_THEME_DATA) setThemeState((window as any).PLUME_THEME_DATA);
      if ((window as any).PLUME_THEME_LIST) setThemeList((window as any).PLUME_THEME_LIST);
    };

    const handleWebviewMessage = (e: any) => {
      const data = e.data || e.detail || e;
      if (data && data.type === 'result' && data.success && data.message === 'Theme updated') {
        if (data.data) {
          setThemeState(data.data);
          // Also update the global window object and the themes map
          (window as any).PLUME_THEME_DATA = data.data;
          themes[data.data.name] = data.data;
        }
      }
    };

    window.addEventListener('plume_theme_refresh', handleSync);
    if ((window as any).chrome && (window as any).chrome.webview) {
      (window as any).chrome.webview.addEventListener('message', handleWebviewMessage);
    }

    return () => {
      window.removeEventListener('plume_theme_refresh', handleSync);
      if ((window as any).chrome && (window as any).chrome.webview) {
        (window as any).chrome.webview.removeEventListener('message', handleWebviewMessage);
      }
    };
  }, []);

  // Apply theme to CSS variables for global access
  useEffect(() => {
    if (!theme || !theme.colors) return;

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

  }, [theme]);

  const setTheme = (themeName: ThemeName) => {
    // We send a command to C++, which will re-export theme_data.js and refresh the webview
    if ((window as any).chrome && (window as any).chrome.webview) {
      (window as any).chrome.webview.postMessage({
        action: 'set-theme',
        theme: themeName
      });
    }
  };

  const toggleTheme = () => {
    if (themeList.length === 0) return;
    const currentIndex = themeList.findIndex(t => t.name === theme.name);
    const nextIndex = (currentIndex + 1) % themeList.length;
    setTheme(themeList[nextIndex].name);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme: theme.name, theme, setTheme, toggleTheme, themeList }}>
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
