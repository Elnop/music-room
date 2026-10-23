import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Integration tests (see doc/development/testing.md): local Supabase stack started by
// `make test-int` (scripts/test-db.sh up), which writes .env.test.
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
