import { env } from '@/shared/config/env.js';
import { logger } from '@/shared/utils/logger.js';

/** `*` allows all; the tunnel URL is added when set. */
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

if (env.TUNNEL_URL) {
	allowedOrigins.push(env.TUNNEL_URL);
	allowedOrigins.push(env.TUNNEL_URL.replace('https://', 'exp://'));
	logger.info(`🌐 Tunnel CORS enabled: ${env.TUNNEL_URL}`);
}

/** No `Origin` (mobile app, server-to-server) is allowed: CORS only concerns browsers. */
export function isOriginAllowed(origin: string | undefined): boolean {
	if (!origin) return true;

	if (env.NODE_ENV === 'development' && (isNgrokOrigin(origin) || origin.startsWith('exp://'))) {
		return true;
	}

	return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
}

const NGROK_DOMAINS = ['ngrok-free.app', 'ngrok-free.dev', 'ngrok.app', 'ngrok.dev', 'ngrok.io'];

/** Matched on the parsed host, not the raw string: `https://ngrok.attacker.example` is not one. */
function isNgrokOrigin(origin: string): boolean {
	let url: URL;
	try {
		url = new URL(origin);
	} catch {
		return false;
	}
	if (url.protocol !== 'https:') return false;
	return NGROK_DOMAINS.some(domain => url.hostname.endsWith(`.${domain}`));
}

/** React Native's Android WebSocket always sends an `Origin` built from the socket URL, the backend's own address. */
export function isSameOrigin(origin: string | undefined, host: string | undefined): boolean {
	if (!origin || !host) return false;
	try {
		return new URL(origin).host === host;
	} catch {
		return false;
	}
}
