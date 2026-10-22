import { createRequire } from 'module';
import { logger } from '@/shared/utils/logger.js';
import type { SoundCloudClient } from '@/features/soundcloud/soundcloud.types.js';

type SoundCloudConstructor = new () => SoundCloudClient;

/** What `require('soundcloud.ts')` returns, depending on the module system. */
type SoundCloudModule = SoundCloudConstructor & {
	default?: SoundCloudModule;
	Soundcloud?: SoundCloudConstructor;
};

/**
 * The client class of soundcloud.ts, which exports it as `default`, as
 * `Soundcloud` or as the module itself.
 */
export function resolveClientClass(loaded: SoundCloudModule): SoundCloudConstructor {
	const outer = loaded.default || loaded;
	return outer.default || outer.Soundcloud || outer;
}

const require = createRequire(import.meta.url);
const SoundCloud = resolveClientClass(require('soundcloud.ts') as SoundCloudModule);

/**
 * The one soundcloud.ts client of the process. The library extracts SoundCloud's
 * client_id from its website by itself.
 */
export const soundcloud: SoundCloudClient = new SoundCloud();

logger.info('SoundCloud service initialized');
