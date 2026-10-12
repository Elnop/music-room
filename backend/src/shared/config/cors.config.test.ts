import { describe, expect, it, vi } from 'vitest';

// Before env.ts is parsed: development, where ngrok and exp:// origins pass.
vi.hoisted(() => {
	process.env.NODE_ENV = 'development';
	process.env.ALLOWED_ORIGINS = 'http://localhost:8081';
	process.env.TUNNEL_URL = '';
});

const { isOriginAllowed } = await import('@/shared/config/cors.config.js');

describe('isOriginAllowed in development', () => {
	it.each([
		'https://abc.ngrok-free.app',
		'https://abc-12-34.ngrok-free.dev',
		'https://team.ngrok.app',
		'https://team.ngrok.dev',
		'https://abc.ngrok.io',
		'exp://192.168.1.20:8081',
		'http://localhost:8081',
	])('allows %s', origin => {
		expect(isOriginAllowed(origin)).toBe(true);
	});

	it.each([
		'https://ngrok.attacker.example',
		'https://abc.ngrok-free.app.attacker.example',
		'https://attackerngrok-free.app',
		'https://ngrok-free.app',
		'http://abc.ngrok-free.app',
		'https://evil.example/ngrok',
		'not a url ngrok',
	])('refuses %s', origin => {
		expect(isOriginAllowed(origin)).toBe(false);
	});

	it('allows requests without an Origin header', () => {
		expect(isOriginAllowed(undefined)).toBe(true);
	});
});

describe('isOriginAllowed outside development', () => {
	it('refuses an ngrok or exp:// origin that is not in ALLOWED_ORIGINS', async () => {
		vi.resetModules();
		vi.stubEnv('NODE_ENV', 'production');
		try {
			const cors = await import('@/shared/config/cors.config.js');
			expect(cors.isOriginAllowed('https://abc.ngrok-free.app')).toBe(false);
			expect(cors.isOriginAllowed('exp://192.168.1.20:8081')).toBe(false);
			expect(cors.isOriginAllowed('http://localhost:8081')).toBe(true);
		} finally {
			vi.unstubAllEnvs();
		}
	});
});
