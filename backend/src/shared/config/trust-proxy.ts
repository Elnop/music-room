import type { IncomingMessage } from 'node:http';
import type { Express } from 'express';
import proxyaddr from 'proxy-addr';
import { env } from '@/shared/config/env.js';
import { compileTrust, parseTrustProxy } from '@/shared/config/trust-proxy-setting.js';

const trustProxy = parseTrustProxy(env.TRUST_PROXY);
const trust = compileTrust(trustProxy);

export function configureTrustProxy(app: Express): void {
	app.set('trust proxy', trustProxy);
}

export function clientIp(req: IncomingMessage): string {
	return proxyaddr(req, trust);
}
