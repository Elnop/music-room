import { describe, expect, it } from 'vitest';
import { soundcloudStreamResultSchema } from '@/features/soundcloud/soundcloud.validators.js';

const RESULT = {
	streamUrl: 'https://cf-media.sndcdn.test/song.mp3',
	expiresAt: '2026-01-01T00:30:00.000Z',
};

describe('soundcloudStreamResultSchema', () => {
	it.each(['hls', 'progressive'])('accepts the %s protocol', protocol => {
		expect(soundcloudStreamResultSchema.parse({ ...RESULT, protocol })).toEqual({
			...RESULT,
			protocol,
		});
	});

	it('refuses a missing or unknown protocol', () => {
		expect(soundcloudStreamResultSchema.safeParse(RESULT).success).toBe(false);
		expect(soundcloudStreamResultSchema.safeParse({ ...RESULT, protocol: 'dash' }).success).toBe(
			false
		);
	});
});
