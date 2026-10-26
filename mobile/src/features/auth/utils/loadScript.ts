// Browser only: the Google and Facebook sign-in SDKs come as third-party scripts.
// The project types no DOM (lib esnext), hence the few element shapes below.

interface DomScript {
	src: string;
	async: boolean;
	onload: (() => void) | null;
	onerror: (() => void) | null;
	remove: () => void;
}

interface DomDocument {
	head: { appendChild: (node: DomScript) => void };
	createElement: (tag: 'script') => DomScript;
}

const loads = new Map<string, Promise<void>>();

/** Appends the script once per URL; a failed load is forgotten, so the next call retries. */
export function loadScript(src: string): Promise<void> {
	const pending = loads.get(src);
	if (pending) return pending;

	const load = new Promise<void>((resolve, reject) => {
		const doc = (globalThis as unknown as { document?: DomDocument }).document;
		if (!doc) {
			reject(new Error(`Could not load ${src}: no document`));
			return;
		}
		const script = doc.createElement('script');
		script.src = src;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => {
			script.remove();
			reject(new Error(`Could not load ${src}`));
		};
		doc.head.appendChild(script);
	});
	loads.set(src, load);
	load.catch(() => loads.delete(src));
	return load;
}

/** A blocked script (content blocker, offline) fails this way. */
export function isScriptLoadError(error: unknown): boolean {
	return error instanceof Error && error.message.startsWith('Could not load ');
}
