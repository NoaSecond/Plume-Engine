// Plume Engine Theme System
// Import all themes and export them

import { Theme } from './types';
import plumeDark from './plume-dark';
import nebulaMidnight from './nebula-midnight';
import featherLight from './feather-light';

export type { Theme };

export type ThemeName = 'plume-dark' | 'nebula-midnight' | 'feather-light';

export const themes: Record<ThemeName, Theme> = {
  'plume-dark': plumeDark,
  'nebula-midnight': nebulaMidnight,
  'feather-light': featherLight,
};

export const defaultTheme: ThemeName = 'plume-dark';

// Export individual themes
export { plumeDark, nebulaMidnight, featherLight };
