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
		include: ['src/**/*.test.ts'],
		exclude: ['src/**/*.int.test.ts', 'node_modules/**', 'dist/**'],
		setupFiles: ['src/test/setup-env.ts'],
		restoreMocks: true,
		// Coverage counts every source file, not only those a test imports.
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts', 'src/test/**', 'src/shared/types/supabase.generated.ts'],
		},
	},
});
