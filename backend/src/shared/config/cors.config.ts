import { env } from '@/shared/config/env.js';
import { logger } from '@/shared/utils/logger.js';

const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

if (env.TUNNEL_URL) {
	allowedOrigins.push(env.TUNNEL_URL);
	allowedOrigins.push(env.TUNNEL_URL.replace('https://', 'exp://'));
	logger.info(`🌐 Tunnel CORS enabled: ${env.TUNNEL_URL}`);
}

export function isOriginAllowed(origin: string | undefined): boolean {
	if (!origin) return true;

	if (env.NODE_ENV === 'development' && (isNgrokOrigin(origin) || origin.startsWith('exp://'))) {
		return true;
	}

	return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
}

const NGROK_DOMAINS = ['ngrok-free.app', 'ngrok-free.dev', 'ngrok.app', 'ngrok.dev', 'ngrok.io'];

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

export function isSameOrigin(origin: string | undefined, host: string | undefined): boolean {
	if (!origin || !host) return false;
	try {
		return new URL(origin).host === host;
	} catch {
		return false;
	}
}
