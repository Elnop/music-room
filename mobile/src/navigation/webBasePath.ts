export function webBasePath(): string {
	return (process.env.EXPO_BASE_URL ?? '').replace(/\/+$/, '');
}

export function stripBasePath(path: string, base = webBasePath()): string {
	if (!base || !path.startsWith(base)) return path;
	const rest = path.slice(base.length);
	if (rest === '') return '/';
	return /^[/?#]/.test(rest) ? rest : path;
}

interface BrowserLocation {
	pathname: string;
	search: string;
	hash: string;
}

interface BrowserHistory {
	replaceState(data: unknown, unused: string, url: string): void;
}

const REDIRECT_PARAM = /[?&]redirect=([^&]*)/;

const browser = globalThis as { location?: BrowserLocation; history?: BrowserHistory };

export function restoreRedirectedPath(
	location = browser.location,
	history = browser.history,
	base = webBasePath()
): void {
	if (!location || !history) return;
	const encoded = REDIRECT_PARAM.exec(location.search)?.[1];
	let redirect: string;
	try {
		redirect = decodeURIComponent(encoded ?? '');
	} catch {
		return;
	}
	if (!redirect.startsWith('/') || redirect.startsWith('//')) return;
	history.replaceState(null, '', `${base}${redirect}${location.hash}`);
}
