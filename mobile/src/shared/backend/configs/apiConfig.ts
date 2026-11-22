export const API_CONFIG = {
	BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
	WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000',
	TIMEOUT: 30000,
} as const;
