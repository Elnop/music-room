const BROWSERS: [RegExp, string][] = [
	[/Edg(A|iOS)?\//, 'Edge'],
	[/OPR\//, 'Opera'],
	[/Firefox\/|FxiOS\//, 'Firefox'],
	[/Chrome\/|CriOS\//, 'Chrome'],
	[/Safari\//, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
	[/Windows/, 'Windows'],
	[/Android/, 'Android'],
	[/iPhone|iPad|iPod/, 'iOS'],
	[/Mac OS X|Macintosh/, 'macOS'],
	[/CrOS/, 'ChromeOS'],
	[/Linux/, 'Linux'],
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
