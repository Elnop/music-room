import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests only (see doc/TESTING.md): no external service, no secret.
export default defineConfig({
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts'],
		exclude: ['src/**/*.int.test.ts', 'node_modules/**', 'dist/**'],
		setupFiles: ['src/test/setup-env.ts'],
		restoreMocks: true,
	},
});
