import type { IncomingMessage } from 'node:http';
import type { Express } from 'express';
import proxyaddr from 'proxy-addr';
import { env } from '@/shared/config/env.js';
import { compileTrust, parseTrustProxy } from '@/shared/config/trust-proxy-setting.js';

/** Already validated by env.ts. */
const trustProxy = parseTrustProxy(env.TRUST_PROXY);
const trust = compileTrust(trustProxy);

/** req.ip then follows the setting. */
export function configureTrustProxy(app: Express): void {
	app.set('trust proxy', trustProxy);
}

/** The Socket.io handshake's client IP, as req.ip would give it. */
export function clientIp(req: IncomingMessage): string {
	return proxyaddr(req, trust);
}
