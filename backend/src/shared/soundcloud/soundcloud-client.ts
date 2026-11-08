import { createRequire } from 'module';
import { logger } from '@/shared/utils/logger.js';

export interface SoundCloudClient {
	tracks: {
		search: (query: { q: string; limit?: number; offset?: number }) => Promise<unknown>;
		get: (urlOrId: string) => Promise<unknown>;
		getStreamUrl: (track: unknown) => Promise<string>;
	};
	util?: {
		streamLink: (trackUrl: string, protocol: 'hls' | 'progressive') => Promise<string>;
	};
}

type SoundCloudConstructor = new () => SoundCloudClient;

type SoundCloudModule = SoundCloudConstructor & {
	default?: SoundCloudModule;
	Soundcloud?: SoundCloudConstructor;
};

export function resolveClientClass(loaded: SoundCloudModule): SoundCloudConstructor {
	const outer = loaded.default || loaded;
	return outer.default || outer.Soundcloud || outer;
}

const require = createRequire(import.meta.url);
const SoundCloud = resolveClientClass(require('soundcloud.ts') as SoundCloudModule);

export const soundcloud: SoundCloudClient = new SoundCloud();

logger.info('SoundCloud service initialized');
