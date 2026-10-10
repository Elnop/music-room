import { env } from '@/shared/config/env.js';
import { logger } from '@/shared/utils/logger.js';

/**
 * Origins allowed by both the HTTP API and Socket.io: `ALLOWED_ORIGINS`
 * (comma-separated, `*` allows all) plus the tunnel URL when one is set.
 */
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

if (env.TUNNEL_URL) {
	allowedOrigins.push(env.TUNNEL_URL);
	allowedOrigins.push(env.TUNNEL_URL.replace('https://', 'exp://'));
	logger.info(`🌐 Tunnel CORS enabled: ${env.TUNNEL_URL}`);
}

/**
 * Whether a request with this `Origin` header may reach the API or the socket.
 * No `Origin` (the mobile app's HTTP calls, server-to-server calls) is allowed:
 * CORS only concerns browsers. In development, ngrok tunnel and `exp://` origins
 * are allowed. The socket also accepts same-origin requests (`isSameOrigin`).
 */
export function isOriginAllowed(origin: string | undefined): boolean {
	if (!origin) return true;

	if (env.NODE_ENV === 'development' && (isNgrokOrigin(origin) || origin.startsWith('exp://'))) {
		return true;
	}

	return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
}

/** Domains ngrok serves tunnels under (free and paid plans). */
const NGROK_DOMAINS = ['ngrok-free.app', 'ngrok-free.dev', 'ngrok.app', 'ngrok.dev', 'ngrok.io'];

/**
 * An https origin on a subdomain of an ngrok domain. Matched on the parsed
 * host name, not the raw string: `https://ngrok.attacker.example` is not one (#209).
 * Any ngrok account can get such a subdomain, so this only narrows the dev
 * rule; the project's own tunnel is also allowed exactly through TUNNEL_URL.
 */
export function isNgrokOrigin(origin: string): boolean {
	let url: URL;
	try {
		url = new URL(origin);
	} catch {
		return false;
	}
	if (url.protocol !== 'https:') return false;
	return NGROK_DOMAINS.some(domain => url.hostname.endsWith(`.${domain}`));
}

/**
 * Whether `origin` names the server itself (same host and port as the `Host`
 * header, any scheme, so a TLS-terminating proxy does not matter). Such a
 * request is not cross-origin. React Native's Android WebSocket always sends
 * `Origin` built from the socket URL, i.e. the backend's own address.
 */
export function isSameOrigin(origin: string | undefined, host: string | undefined): boolean {
	if (!origin || !host) return false;
	try {
		return new URL(origin).host === host;
	} catch {
		return false;
	}
}
