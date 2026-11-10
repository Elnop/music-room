import { formatDuration } from '@/shared/utils/formatters';
import type { PlaylistWithTracks } from '@/features/playlists/types';

/** What both playlist headers (phone and wide screens) say about the playlist. */
export function headerFacts(playlist: PlaylistWithTracks) {
	const trackCount = playlist.tracks.length;
	const collaborators = playlist.collaboratorIds.length;
	return {
		trackCount,
		trackLabel: `${trackCount} ${trackCount === 1 ? 'titre' : 'titres'}`,
		duration: formatDuration(playlist.tracks.reduce((total, track) => total + track.durationMs, 0)),
		collaborators,
		ownerName: playlist.owner.displayName || playlist.owner.username,
		collaboratorLabel:
			collaborators > 0
				? `${collaborators} ${collaborators === 1 ? 'collaborateur' : 'collaborateurs'}`
				: null,
	};
}
