import proxyaddr from 'proxy-addr';

/**
 * Which proxies in front of the backend are trusted to set X-Forwarded-For
 * (#173), as Express's `trust proxy` reads it: false (default: the socket's
 * peer is the client, X-Forwarded-For is ignored), true, a hop count, or
 * addresses, subnets and names (`loopback`, `linklocal`, `uniquelocal`)
 * separated by commas. No env import: env.ts validates with these.
 */
type TrustProxySetting = boolean | number | string;

export function parseTrustProxy(value: string): TrustProxySetting {
	const trimmed = value.trim().toLowerCase();
	if (trimmed === '' || trimmed === 'false') return false;
	if (trimmed === 'true') return true;
	if (/^\d+$/.test(trimmed)) return Number(trimmed);
	return trimmed
		.split(',')
		.map(part => part.trim())
		.join(',');
}

/** Same rules as Express's compileTrust, so HTTP and Socket.io agree. Throws on a bad address. */
export function compileTrust(setting: TrustProxySetting): (addr: string, hop: number) => boolean {
	if (setting === true) return () => true;
	if (setting === false) return () => false;
	if (typeof setting === 'number') return (_addr, hop) => hop < setting;
	return proxyaddr.compile(setting.split(','));
}
