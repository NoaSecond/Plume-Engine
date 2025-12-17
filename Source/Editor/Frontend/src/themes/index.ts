import { Theme } from './types';

export type { Theme };
export type ThemeName = string;

// Dynamically load all theme files in the current directory
const modules = import.meta.glob<Record<string, Theme>>('./*.ts', { eager: true });

export const themes: Record<string, Theme> = {};

// Default theme identifier
export let defaultTheme = 'plume-dark';

// Process loaded modules
for (const path in modules) {
  // Extract filename as key (e.g. "./forest.ts" -> "forest")
  const fileName = path.split('/').pop()?.replace('.ts', '') || '';

  // Skip index and types files
  if (fileName === 'index' || fileName === 'types') continue;

  const module = modules[path];

  // Look for default export or named export matching the filename or just the first export that looks like a Theme
  // Our convention is likely `export default theme` or `export const themeName = ...`
  // We'll trust the default export first, then named exports
  let validTheme: Theme | undefined = undefined;

  if (module.default && module.default.name && module.default.colors) {
    validTheme = module.default;
  } else {
    // Fallback: search exports for a Theme-like object
    for (const key of Object.keys(module)) {
      const exportItem = module[key];
      if (exportItem && typeof exportItem === 'object' && 'colors' in exportItem && 'name' in exportItem) {
        validTheme = exportItem as Theme;
        break;
      }
    }
  }

  if (validTheme) {
    themes[validTheme.name] = validTheme;
  }
}

// Ensure default theme exists, otherwise pick the first one available
if (!themes[defaultTheme]) {
  const keys = Object.keys(themes);
  if (keys.length > 0) {
    defaultTheme = keys[0];
  }
}
