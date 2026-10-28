const SCHEME_PREFIX = 'com.googleusercontent.apps.';

/** Google's iOS URL scheme is its iOS client ID written backwards: one gives the other. */
export function googleIosClientId(urlScheme: string | undefined): string | undefined {
	if (!urlScheme?.startsWith(SCHEME_PREFIX)) return undefined;
	return `${urlScheme.slice(SCHEME_PREFIX.length)}.apps.googleusercontent.com`;
}
