import { rateLimitConfig } from '@/shared/config/rate-limit.config.js';
import { logger } from '@/shared/utils/logger.js';
import * as counter from '@/shared/security/counter.js';
import { failOpen } from '@/shared/security/fail-open.js';
import type { IPReputationStatus } from '@/shared/security/security.types.js';

// Failed logins per IP across accounts; past the blacklist threshold every /api/auth/* request is refused. Fails open.

const FAILED_WINDOW_MS = 15 * 60 * 1000;
const BLACKLIST_SECONDS = 24 * 60 * 60;

const failedKey = (ip: string) => `ip_failed_logins:${ip}`;
const blacklistKey = (ip: string) => `ip_blacklist:${ip}`;

async function blacklistIP(ip: string, durationSeconds: number): Promise<void> {
	try {
		await counter.setFlag(blacklistKey(ip), durationSeconds, '1');
		logger.error('IP added to blacklist', {
			ip,
			durationSeconds,
			expiresAt: new Date(Date.now() + durationSeconds * 1000).toISOString(),
		});
	} catch (error) {
		logger.error('Error blacklisting IP', {
			error: error instanceof Error ? error.message : 'Unknown error',
			ip,
		});
	}
}

export async function recordIPActivity(ip: string): Promise<IPReputationStatus> {
	return failOpen<IPReputationStatus>(
		{
			disabled: 'IP reputation tracking disabled (development mode)',
			unavailable: 'Cannot record IP activity - Redis not connected',
			failed: 'Error recording IP activity',
			fallback: { status: 'normal', count: 0 },
		},
		{ ip },
		async () => {
			const { blacklistThreshold, blockThreshold, throttleThreshold } =
				rateLimitConfig.ipReputation;
			const { count } = await counter.hit(failedKey(ip), FAILED_WINDOW_MS);

			if (count >= blacklistThreshold) {
				await blacklistIP(ip, BLACKLIST_SECONDS);
				logger.error('IP blacklisted', { ip, count, threshold: blacklistThreshold });
				return { status: 'blacklisted', count };
			}
			if (count >= blockThreshold) {
				logger.warn('IP blocked', { ip, count, threshold: blockThreshold });
				return { status: 'blocked', count };
			}
			if (count >= throttleThreshold) {
				logger.warn('IP throttled', { ip, count, threshold: throttleThreshold });
				return { status: 'throttled', count };
			}
			return { status: 'normal', count };
		}
	);
}

export async function isIPBlacklisted(ip: string): Promise<boolean> {
	return failOpen(
		{
			disabled: 'IP blacklist check disabled (development mode)',
			unavailable: 'Cannot check IP blacklist - Redis not connected',
			failed: 'Error checking IP blacklist',
			fallback: false,
		},
		{ ip },
		async () => (await counter.readFlag(blacklistKey(ip))).isSet
	);
}
