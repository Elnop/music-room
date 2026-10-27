// GitHub Pages serves the web app under a sub-path (experiments.baseUrl) and answers every unknown
// path with site/404.html, which sends the browser back to the app root with the path in `redirect`.

/** Inlined by babel-preset-expo from experiments.baseUrl; empty when the app is served at the root. */
export function webBasePath(): string {
	return (process.env.EXPO_BASE_URL ?? '').replace(/\/+$/, '');
}

/** The app path of a browser path: the base path removed, `/` for the base itself. */
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

/** Read by hand: React Native's URLSearchParams type has no `get`. */
const REDIRECT_PARAM = /[?&]redirect=([^&]*)/;

const browser = globalThis as { location?: BrowserLocation; history?: BrowserHistory };

/** Puts the path 404.html carried in the query back in the address bar, before navigation reads it. */
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
	// Only a path of the app: `//host` would leave the origin
	if (!redirect.startsWith('/') || redirect.startsWith('//')) return;
	history.replaceState(null, '', `${base}${redirect}${location.hash}`);
}
