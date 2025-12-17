// Theme type definitions

export interface Theme {
  name: string;
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
    // Item Selection colors
    selection: {
      background: string;
      border: string;
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
