/**
 * Environment for integration tests.
 *
 * Loads .env.test, written by `scripts/test-db.sh up` with the local Supabase
 * stack's URL and keys and the test Redis container's host and port, before
 * any module reads `@/shared/config/env.js`.
 * It overrides the shell environment, and env.ts's own dotenv call never
 * overrides what is set here, so the hosted project's keys in backend/.env
 * cannot be picked up.
 */
import { existsSync } from 'node:fs';
import { config } from 'dotenv';

const envFile = new URL('../../.env.test', import.meta.url);

if (!existsSync(envFile)) {
	throw new Error('backend/.env.test is missing: run `make test-int` (or scripts/test-db.sh up)');
}

config({ path: envFile.pathname, override: true, quiet: true });

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
	throw new Error(
		'backend/.env.test has no REDIS_HOST/REDIS_PORT: rerun `make test-int` (or scripts/test-db.sh up)'
	);
}

const placeholders: Record<string, string> = {
	NODE_ENV: 'test',
	GMAIL_USER: 'test@example.com',
	GMAIL_APP_PASSWORD: 'test-app-password',
};

for (const [key, value] of Object.entries(placeholders)) {
	process.env[key] ??= value;
}
