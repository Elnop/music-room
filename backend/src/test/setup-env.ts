const placeholders: Record<string, string> = {
	NODE_ENV: 'test',
	SUPABASE_URL: 'http://supabase.test.invalid',
	SUPABASE_ANON_KEY: 'test-anon-key',
	SUPABASE_SERVICE_KEY: 'test-service-key',
	REDIS_HOST: 'redis.test.invalid',
	GMAIL_USER: 'test@example.com',
	GMAIL_APP_PASSWORD: 'test-app-password',
	GOOGLE_CLIENT_ID: 'test-google-client-id.apps.googleusercontent.com',
	FACEBOOK_APP_ID: 'test-facebook-app-id',
};

for (const [key, value] of Object.entries(placeholders)) {
	process.env[key] = value;
}
