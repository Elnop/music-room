import { toTrackInput } from './trackInput';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import type { Track } from '@/types/track.types';

const soundCloudTrack: SoundCloudTrack = {
	id: 7,
	title: 'Song',
	description: null,
	duration: 123000,
	genre: null,
	artwork_url: 'https://img/art.jpg',
	permalink_url: 'https://soundcloud.com/artist/song',
	user: { id: 1, username: 'Artist', avatar_url: 'https://img/avatar.jpg', permalink_url: '' },
	playable: true,
};

describe('toTrackInput', () => {
	it('converts a SoundCloud search result', () => {
		expect(toTrackInput(soundCloudTrack)).toEqual({
			trackUri: 'https://soundcloud.com/artist/song',
			title: 'Song',
			artist: 'Artist',
			album: undefined,
			albumArt: 'https://img/art.jpg',
			durationMs: 123000,
		});
	});

	it('falls back to the avatar, then to no artwork', () => {
		expect(toTrackInput({ ...soundCloudTrack, artwork_url: null }).albumArt).toBe(
			'https://img/avatar.jpg'
		);
		expect(
			toTrackInput({
				...soundCloudTrack,
				artwork_url: null,
				user: { ...soundCloudTrack.user, avatar_url: null },
			}).albumArt
		).toBeUndefined();
	});

	it('converts a stored track without its id or previewUrl', () => {
		const track: Track = {
			id: 'uuid',
			title: 'Song',
			artist: 'Artist',
			album: 'Album',
			albumArt: 'https://img/art.jpg',
			durationMs: 1000,
			trackUri: 'https://soundcloud.com/artist/song',
			previewUrl: 'https://stream/expiring',
		};
		const body = toTrackInput(track);
		expect(body).toEqual({
			trackUri: 'https://soundcloud.com/artist/song',
			title: 'Song',
			artist: 'Artist',
			album: 'Album',
			albumArt: 'https://img/art.jpg',
			durationMs: 1000,
		});
		expect(body).not.toHaveProperty('previewUrl');
		expect(body).not.toHaveProperty('id');
	});
});
