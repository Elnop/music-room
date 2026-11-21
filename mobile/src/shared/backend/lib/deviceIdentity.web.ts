const BROWSERS: [RegExp, string][] = [
	[/Edg(A|iOS)?\//u, 'Edge'],
	[/OPR\//u, 'Opera'],
	[/Firefox\/|FxiOS\//u, 'Firefox'],
	[/Chrome\/|CriOS\//u, 'Chrome'],
	[/Safari\//u, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
	[/Windows/u, 'Windows'],
	[/Android/u, 'Android'],
	[/iPhone|iPad|iPod/u, 'iOS'],
	[/Mac OS X|Macintosh/u, 'macOS'],
	[/CrOS/u, 'ChromeOS'],
	[/Linux/u, 'Linux'],
];

function match(userAgent: string, table: [RegExp, string][]): string | null {
	return table.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;
}

function describe(joiner: string): string | null {
	const { userAgent = '' } = (globalThis as { navigator?: { userAgent?: string } }).navigator ?? {};
	const browser = match(userAgent, BROWSERS);
	const system = match(userAgent, SYSTEMS);
	if (browser && system) return `${browser} ${joiner} ${system}`;
	return browser ?? system;
}

export function getModelName(): string | null {
	return describe('on');
}

export function getDeviceName(): string | null {
	return describe('sur');
}
