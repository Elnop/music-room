import http, { type IncomingHttpHeaders, type OutgoingHttpHeaders } from 'node:http';
import https from 'node:https';
import type { Express, Request, RequestHandler, Response } from 'express';
import { logger } from '@/shared/utils/logger.js';
import { AppError, sendError } from '@/shared/middleware/error-handler.js';

/**
 * Dev-only reverse proxy for `make dev-tunnel` with the local Supabase stack
 * (#251): ngrok's free plan gives one endpoint, the backend's, so the app on
 * a phone on another network reaches the stack's auth API through
 * `<backend tunnel>/supabase/auth/v1/*`. Only `/auth/v1` is forwarded: the
 * public tunnel must not expose PostgREST, storage or Studio.
 *
 * Mounted before the body parsers so the raw request body is streamed through.
 */

const AUTH_PREFIX = '/auth/v1';

// A hung stack must not keep the client waiting: the error path answers 502.
const UPSTREAM_TIMEOUT_MS = 30_000;

// Hop-by-hop headers (RFC 9110 §7.6.1) are not forwarded.
const HOP_BY_HOP = [
	'connection',
	'keep-alive',
	'proxy-connection',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailer',
	'upgrade',
];

function withoutHopByHop(headers: IncomingHttpHeaders): OutgoingHttpHeaders {
	const result: OutgoingHttpHeaders = { ...headers };
	for (const name of HOP_BY_HOP) delete result[name];
	return result;
}

/**
 * Path and query to forward, or null outside `/auth/v1`. The WHATWG parser
 * resolves dot segments (also percent-encoded ones) and backslashes first, so
 * `/auth/v1/../rest/v1` cannot slip through to another service.
 */
function authTarget(url: string): string | null {
	const parsed = new URL(url, 'http://proxy.invalid');
	const { pathname } = parsed;
	if (pathname !== AUTH_PREFIX && !pathname.startsWith(`${AUTH_PREFIX}/`)) return null;
	return `${pathname}${parsed.search}`;
}

// Upstream answers (errors included) are piped through untouched: they carry
// Supabase's own body, which the app's Supabase client reads. Only the proxy's
// own failure uses the API error format.
function sendUnreachable(req: Request, res: Response, error: Error): void {
	sendError(
		req,
		res,
		new AppError(502, 'Local Supabase stack unreachable', 'SUPABASE_UNREACHABLE', undefined, {
			why: error.message,
			fix: 'Start the local stack with make supabase-up',
		})
	);
}

export function createSupabaseAuthProxy(
	upstreamUrl: string,
	timeoutMs = UPSTREAM_TIMEOUT_MS
): RequestHandler {
	const upstream = new URL(upstreamUrl);
	const transport = upstream.protocol === 'https:' ? https : http;
	const basePath = upstream.pathname.replace(/\/+$/, '');

	return (req, res, next) => {
		const target = authTarget(req.url);
		if (target === null) {
			next();
			return;
		}

		const proxyReq = transport.request(
			{
				protocol: upstream.protocol,
				hostname: upstream.hostname,
				port: upstream.port,
				method: req.method,
				path: `${basePath}${target}`,
				headers: { ...withoutHopByHop(req.headers), host: upstream.host },
			},
			proxyRes => {
				const headers = withoutHopByHop(proxyRes.headers);
				// Node re-frames the body itself (chunked when no content-length).
				delete headers['transfer-encoding'];
				res.writeHead(proxyRes.statusCode ?? 502, headers);
				// Upstream cut mid-body: end the client's response instead of hanging.
				proxyRes.on('aborted', () => res.destroy());
				proxyRes.on('error', () => res.destroy());
				proxyRes.pipe(res);
			}
		);

		let clientGone = false;

		proxyReq.setTimeout(timeoutMs, () => {
			proxyReq.destroy(new Error(`No answer from upstream within ${timeoutMs} ms`));
		});

		proxyReq.on('error', error => {
			if (clientGone) return;
			logger.warn('Supabase auth proxy: upstream request failed', {
				method: req.method,
				path: target.split('?')[0],
				error: error.message,
			});
			if (res.headersSent) res.destroy();
			else sendUnreachable(req, res, error);
		});

		// Client gone before the upstream answered: drop the upstream request.
		res.on('close', () => {
			if (res.writableFinished) return;
			clientGone = true;
			proxyReq.destroy();
		});

		req.pipe(proxyReq);
	};
}

interface ProxySettings {
	TUNNEL_MODE: boolean;
	NODE_ENV: string;
	SUPABASE_MODE?: 'local' | 'hosted';
	SUPABASE_URL: string;
}

/**
 * Mounts the proxy on `/supabase` only in tunnel mode during development with
 * the local Supabase stack (hosted mode: the app talks to the project itself).
 * Call it before CORS and the body parsers. Returns whether it was mounted.
 */
export function mountSupabaseAuthProxy(app: Express, settings: ProxySettings): boolean {
	if (
		!settings.TUNNEL_MODE ||
		settings.NODE_ENV !== 'development' ||
		settings.SUPABASE_MODE !== 'local'
	) {
		return false;
	}
	app.use('/supabase', createSupabaseAuthProxy(settings.SUPABASE_URL));
	return true;
}
