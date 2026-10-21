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
		// `npm run test:coverage`: every source file counts, not only those a
		// test imports. The floor is recorded on epic #362 (doc/TESTING.md).
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts', 'src/test/**', 'src/shared/types/supabase.generated.ts'],
		},
	},
});
