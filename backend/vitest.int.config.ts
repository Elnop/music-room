import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	test: {
		environment: 'node',
		include: ['src/**/*.int.test.ts'],
		setupFiles: ['src/test/setup-int-env.ts'],
		fileParallelism: false,
		testTimeout: 15_000,
	},
});
