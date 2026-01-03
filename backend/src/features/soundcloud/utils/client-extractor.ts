import type { SoundCloudClient } from '@/features/soundcloud/soundcloud.types.js';

/**
 * SoundCloud module/class constructor
 */
type SoundCloudConstructor = new () => SoundCloudClient;

/**
 * Initialize SoundCloud instance with proper class resolution
 * soundcloud.ts exports the class in different ways depending on module system
 */
export function initializeSoundcloudInstance(SoundcloudModule: unknown): SoundCloudClient {
	const moduleObj = SoundcloudModule as {
		default?: SoundCloudConstructor;
		Soundcloud?: SoundCloudConstructor;
	};

	const SoundcloudClass =
		moduleObj.default || moduleObj.Soundcloud || (SoundcloudModule as SoundCloudConstructor);

	return new SoundcloudClass();
}
