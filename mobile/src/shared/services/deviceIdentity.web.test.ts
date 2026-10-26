import { getDeviceName, getModelName } from './deviceIdentity.web';

const AGENTS = {
	chromeWindows:
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
	firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
	safariMac:
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
	edgeWindows:
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
	chromeAndroid:
		'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
	safariIphone:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
};

function setUserAgent(userAgent: string | undefined): void {
	Object.defineProperty(globalThis, 'navigator', {
		value: userAgent === undefined ? undefined : { userAgent },
		configurable: true,
	});
}

const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
afterAll(() => {
	if (original) Object.defineProperty(globalThis, 'navigator', original);
});

describe('deviceIdentity (web)', () => {
	it.each([
		[AGENTS.chromeWindows, 'Chrome on Windows'],
		[AGENTS.firefoxLinux, 'Firefox on Linux'],
		[AGENTS.safariMac, 'Safari on macOS'],
		[AGENTS.edgeWindows, 'Edge on Windows'],
		[AGENTS.chromeAndroid, 'Chrome on Android'],
		[AGENTS.safariIphone, 'Safari on iOS'],
	])('reads the browser and the system from %s', (userAgent, model) => {
		setUserAgent(userAgent);
		expect(getModelName()).toBe(model);
	});

	it('names the device in French for the device list', () => {
		setUserAgent(AGENTS.firefoxLinux);
		expect(getDeviceName()).toBe('Firefox sur Linux');
	});

	it('is null without a recognisable user agent', () => {
		setUserAgent(undefined);
		expect(getModelName()).toBeNull();
		setUserAgent('curl/8.0');
		expect(getDeviceName()).toBeNull();
	});
});
