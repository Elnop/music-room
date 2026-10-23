import proxyaddr from 'proxy-addr';

/** Express `trust proxy` format; default false (X-Forwarded-For ignored). No env import: env.ts validates with these. */
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
