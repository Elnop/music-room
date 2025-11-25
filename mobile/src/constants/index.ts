// API Configuration (backend: http://localhost:3000)
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000',
  TIMEOUT: 10000,
} as const;

// Supabase Configuration (backend: @supabase/supabase-js@2.50.0+)
export const SUPABASE_CONFIG = {
  URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
} as const;

// Spotify Configuration
export const SPOTIFY_CONFIG = {
  CLIENT_ID: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '',
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'Music Room',
  VERSION: '1.0.0',
  BUILD_NUMBER: 1,
} as const;

// Theme Colors (Spotify-inspired dark theme)
export const COLORS = {
  primary: '#1DB954', // Spotify Green
  secondary: '#191414', // Near Black
  background: '#121212', // Pure Black
  surface: '#282828', // Dark Gray
  text: '#FFFFFF', // White
  textSecondary: '#B3B3B3', // Light Gray
  error: '#E63946', // Red
  success: '#06D6A0', // Teal
  warning: '#FFB703', // Amber
} as const;

// Spacing System
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Typography
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
