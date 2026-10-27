// Browser variant: expo-device leaves the model and the name empty on the web, so both
// come from the user agent.

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

/** `Chrome on Windows` with `on`; null when the user agent names neither. */
function describe(joiner: string): string | null {
	const { userAgent = '' } = (globalThis as { navigator?: { userAgent?: string } }).navigator ?? {};
	const browser = match(userAgent, BROWSERS);
	const system = match(userAgent, SYSTEMS);
	if (browser && system) return `${browser} ${joiner} ${system}`;
	return browser ?? system;
}

/** Sent in English to the backend logs. */
export function getModelName(): string | null {
	return describe('on');
}

/** Shown in the device list. */
export function getDeviceName(): string | null {
	return describe('sur');
}
