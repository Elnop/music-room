import type { IncomingMessage } from 'node:http';
import type { Express } from 'express';
import proxyaddr from 'proxy-addr';
import { env } from '@/shared/config/env.js';
import { compileTrust, parseTrustProxy } from '@/shared/config/trust-proxy-setting.js';

/** TRUST_PROXY, already validated by env.ts (see trust-proxy-setting.ts). */
export const trustProxy = parseTrustProxy(env.TRUST_PROXY);
const trust = compileTrust(trustProxy);

/** Apply the setting to an Express app: req.ip then follows it. */
export function configureTrustProxy(app: Express): void {
	app.set('trust proxy', trustProxy);
}

/** Client IP of a raw request (the Socket.io handshake), as req.ip would give it. */
export function clientIp(req: IncomingMessage): string {
	return proxyaddr(req, trust);
}
