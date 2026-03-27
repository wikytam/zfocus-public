export const theme = {
  colors: {
    background: '#f8f8f6',
    foreground: '#1a1a1a',
    card: '#ffffff',
    cardForeground: '#1a1a1a',
    primary: '#1a1a1a',
    primaryForeground: '#f8f8f6',
    secondary: '#f2f0ec',
    secondaryForeground: '#1a1a1a',
    muted: '#eae8e4',
    mutedForeground: '#78726b',
    accent: '#16825d',
    accentForeground: '#ffffff',
    destructive: '#dc3545',
    destructiveForeground: '#ffffff',
    border: '#e8e5e0',
    success: '#16825d',
    chart1: '#16825d',
    chart2: '#4a9e7f',
    chart3: '#1a5c42',
    chart4: '#d4a853',
  },
  radius: {
    sm: '0.5rem',
    md: '0.625rem',
    lg: '0.875rem',
    xl: '1.25rem',
    '2xl': '1rem',
  },
} as const;

export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;
export const SCENE_DURATION_SECONDS = 8;
export const SCENE_DURATION_FRAMES = SCENE_DURATION_SECONDS * VIDEO_FPS;
export const TRANSITION_DURATION_FRAMES = 15;
export const TOTAL_SCENES = 7;
