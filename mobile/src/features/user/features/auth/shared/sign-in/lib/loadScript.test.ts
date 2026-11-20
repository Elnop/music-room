import { isScriptLoadError, loadScript } from './loadScript';

interface FakeScript {
	src: string;
	async: boolean;
	onload: (() => void) | null;
	onerror: (() => void) | null;
	remove: jest.Mock;
}

let appended: FakeScript[];
const realDocument = (globalThis as { document?: unknown }).document;

beforeEach(() => {
	appended = [];
	(globalThis as { document?: unknown }).document = {
		head: { appendChild: (node: FakeScript) => appended.push(node) },
		createElement: (): FakeScript => ({
			src: '',
			async: false,
			onload: null,
			onerror: null,
			remove: jest.fn(),
		}),
	};
});

afterEach(() => {
	(globalThis as { document?: unknown }).document = realDocument;
});

describe('loadScript', () => {
	it('appends an async script and resolves once it loads', async () => {
		const load = loadScript('https://example.com/ok.js');
		expect(appended).toHaveLength(1);
		expect(appended[0]).toMatchObject({ src: 'https://example.com/ok.js', async: true });

		appended[0].onload?.();
		await expect(load).resolves.toBeUndefined();
	});

	it('loads a URL once', async () => {
		const first = loadScript('https://example.com/once.js');
		const second = loadScript('https://example.com/once.js');
		appended[0].onload?.();

		expect(second).toBe(first);
		await first;
		await loadScript('https://example.com/once.js');
		expect(appended).toHaveLength(1);
	});

	it('rejects when the script does not load, and retries on the next call', async () => {
		const load = loadScript('https://example.com/blocked.js');
		appended[0].onerror?.();

		const error = await load.catch((reason: unknown) => reason);
		expect(isScriptLoadError(error)).toBe(true);
		expect(appended[0].remove).toHaveBeenCalled();

		void loadScript('https://example.com/blocked.js');
		expect(appended).toHaveLength(2);
	});

	it('rejects without a document', async () => {
		(globalThis as { document?: unknown }).document = undefined;

		await expect(loadScript('https://example.com/none.js')).rejects.toThrow('no document');
	});
});

describe('isScriptLoadError', () => {
	it('recognizes only a load failure', () => {
		expect(isScriptLoadError(new Error('Could not load https://example.com/x.js'))).toBe(true);
		expect(isScriptLoadError(new Error('SIGN_IN_CANCELLED'))).toBe(false);
		expect(isScriptLoadError('Could not load')).toBe(false);
	});
});
