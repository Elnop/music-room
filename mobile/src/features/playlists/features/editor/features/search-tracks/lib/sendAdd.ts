import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError } from '@/shared/theme/lib/toast';
import { toTrackInput } from '@/shared/tracks/lib/toTrackInput';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import type { AddContext } from '@/features/playlists/features/editor/features/search-tracks/searchTracksTypes';

export async function sendAdd(context: AddContext, track: SoundCloudTrack): Promise<void> {
	const uri = track.permalink_url;
	const { tracker } = context;
	if (tracker.sending.has(uri)) return;
	tracker.sending.add(uri);
	tracker.mark(uri);
	try {
		await context.mutate({ playlistId: context.playlistId, track: toTrackInput(track) });
	} catch (error) {
		tracker.unmark(uri);
		showError(apiErrorMessage(error, "Impossible d'ajouter le titre à la playlist"));
	} finally {
		tracker.sending.delete(uri);
	}
}
