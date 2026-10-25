// Loads .env.test (written by `scripts/test-db.sh up`) before any module reads env.ts, overriding the
// shell, so the hosted project's keys in backend/.env cannot be picked up.

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
	GOOGLE_CLIENT_ID: 'test-google-client-id.apps.googleusercontent.com',
	FACEBOOK_APP_ID: 'test-facebook-app-id',
};

for (const [key, value] of Object.entries(placeholders)) {
	process.env[key] ??= value;
}
