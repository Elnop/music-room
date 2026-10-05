/**
 * Placeholder environment for unit tests.
 *
 * `@/shared/config/env.js` validates process.env at import and exits on a
 * missing variable. These values satisfy the schema without pointing at any
 * real service; dotenv never overrides a variable that is already set, so a
 * local backend/.env cannot leak real keys into unit tests.
 */
const placeholders: Record<string, string> = {
	NODE_ENV: 'test',
	SUPABASE_URL: 'http://supabase.test.invalid',
	SUPABASE_ANON_KEY: 'test-anon-key',
	SUPABASE_SERVICE_KEY: 'test-service-key',
	REDIS_HOST: 'redis.test.invalid',
	GMAIL_USER: 'test@example.com',
	GMAIL_APP_PASSWORD: 'test-app-password',
};

for (const [key, value] of Object.entries(placeholders)) {
	process.env[key] = value;
}
