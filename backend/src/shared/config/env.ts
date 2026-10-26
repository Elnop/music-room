import { config } from 'dotenv';
import { z } from 'zod';
import { compileTrust, parseTrustProxy } from '@/shared/config/trust-proxy-setting.js';

config();

const envSchema = z.object({
	SUPABASE_URL: z.url('Invalid Supabase URL'),
	SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
	SUPABASE_SERVICE_KEY: z.string().min(1, 'Supabase service key is required'),
	PORT: z.string().default('3000').transform(Number),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	ALLOWED_ORIGINS: z.string().default('http://localhost:8081'),
	TUNNEL_URL: z.string().optional(),

	REDIS_HOST: z.string().default('redis'),
	REDIS_PORT: z.string().default('6379'),
	REDIS_PASSWORD: z.string().optional(),
	REDIS_DB: z.string().default('0'),

	RATE_LIMIT_ENABLED: z.string().default('true'),
	RATE_LIMIT_LOGIN_WINDOW_MS: z.string().default('900000'),
	RATE_LIMIT_LOGIN_MAX: z.string().default('5'),
	RATE_LIMIT_REGISTER_WINDOW_MS: z.string().default('3600000'),
	RATE_LIMIT_REGISTER_MAX: z.string().default('3'),
	RATE_LIMIT_OAUTH_WINDOW_MS: z.string().default('900000'),
	RATE_LIMIT_OAUTH_MAX: z.string().default('10'),
	RATE_LIMIT_AUTH_WINDOW_MS: z.string().default('900000'),
	RATE_LIMIT_AUTH_MAX: z.string().default('20'),
	// Validated: NaN or 0 would block every IP forever.
	RATE_LIMIT_TOKEN_WINDOW_MS: z.coerce.number().int().positive().default(900000),
	RATE_LIMIT_TOKEN_MAX: z.coerce.number().int().positive().default(20),
	RATE_LIMIT_SOUNDCLOUD_WINDOW_MS: z.coerce.number().int().positive().default(60000),
	RATE_LIMIT_SOUNDCLOUD_MAX: z.coerce.number().int().positive().default(120),
	RATE_LIMIT_AVATAR_WINDOW_MS: z.coerce.number().int().positive().default(3600000),
	RATE_LIMIT_AVATAR_MAX: z.coerce.number().int().positive().default(10),
	RATE_LIMIT_SUBSCRIPTION_WINDOW_MS: z.coerce.number().int().positive().default(3600000),
	RATE_LIMIT_SUBSCRIPTION_MAX: z.coerce.number().int().positive().default(20),

	ACCOUNT_LOCKOUT_ENABLED: z.string().default('true'),
	ACCOUNT_LOCKOUT_THRESHOLD: z.string().default('5'),
	ACCOUNT_LOCKOUT_DURATION_SOFT: z.string().default('900'),
	ACCOUNT_LOCKOUT_DURATION_HARD: z.string().default('3600'),
	ACCOUNT_LOCKOUT_DURATION_SEVERE: z.string().default('86400'),

	IP_THROTTLE_THRESHOLD: z.string().default('10'),
	IP_BLOCK_THRESHOLD: z.string().default('20'),
	IP_BLACKLIST_THRESHOLD: z.string().default('50'),

	RATE_LIMIT_WHITELIST_IPS: z.string().default(''),

	TRUST_PROXY: z
		.string()
		.default('')
		.refine(
			value => {
				try {
					compileTrust(parseTrustProxy(value));
					return true;
				} catch {
					return false;
				}
			},
			{
				message:
					'Expected empty, true, false, a hop count, or addresses, subnets, loopback, linklocal, uniquelocal (comma-separated)',
			}
		),

	GMAIL_USER: z.email('Invalid Gmail user address'),
	GMAIL_APP_PASSWORD: z.string().min(1, 'Gmail app password is required'),
	// Plain SMTP server used instead of Gmail when set (the dev stack's Mailpit). No TLS, no auth.
	SMTP_HOST: z.string().min(1).optional(),
	SMTP_PORT: z.coerce.number().int().positive().default(54425),

	EMAIL_VERIFICATION_ENABLED: z.string().default('true'),
	EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES: z.string().default('15'),
	EMAIL_VERIFICATION_MAX_ATTEMPTS: z.string().default('5'),
	EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: z.string().default('60'),
	EMAIL_VERIFICATION_MAX_RESENDS_PER_HOUR: z.string().default('3'),
});

type Env = z.infer<typeof envSchema>;

const parseEnv = (): Env => {
	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		// The logger reads env, so it cannot exist yet: console is allowed here.
		console.error('Invalid environment variables:');
		console.error(result.error.format());
		process.exit(1);
	}

	return result.data;
};

export const env = parseEnv();
