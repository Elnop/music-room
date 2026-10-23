import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Needs the local Supabase stack started by `make test-int`, which writes .env.test.
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
		// Tests share one database; run files one after another.
		fileParallelism: false,
		testTimeout: 15_000,
	},
});
