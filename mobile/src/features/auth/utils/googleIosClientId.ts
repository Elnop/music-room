const SCHEME_PREFIX = 'com.googleusercontent.apps.';

export function googleIosClientId(urlScheme: string | undefined): string | undefined {
	if (!urlScheme?.startsWith(SCHEME_PREFIX)) return undefined;
	return `${urlScheme.slice(SCHEME_PREFIX.length)}.apps.googleusercontent.com`;
}
