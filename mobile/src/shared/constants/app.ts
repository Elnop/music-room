// API Configuration (backend: http://localhost:3000)
// BASE_URL is only the build-time default: requests read the runtime address
// from services/backendUrl.ts.
export const API_CONFIG = {
	BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
	WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000',
	TIMEOUT: 10000,
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
