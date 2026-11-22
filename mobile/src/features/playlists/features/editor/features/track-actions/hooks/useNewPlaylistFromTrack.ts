import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import { PLAYLIST_NAME_MAX } from '@/features/playlists/features/editor/features/track-actions/playlistNameConfig';
import { useDraftState } from '@/features/playlists/features/editor/features/track-actions/hooks/useDraftState';
import { useNewPlaylistContext } from '@/features/playlists/features/editor/features/track-actions/hooks/useNewPlaylistContext';
import { submitNewPlaylist } from '@/features/playlists/features/editor/features/track-actions/lib/submitNewPlaylist';
import type { NewPlaylistDraft } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';

export function useNewPlaylistFromTrack(
	track: AddQueueItemBody | null,
	onClose: () => void,
): NewPlaylistDraft {
	const draft = useDraftState();
	const context = useNewPlaylistContext(draft, onClose);

	async function submit() {
		if (!track || draft.creating) return;
		await submitNewPlaylist(context, track);
	}

	return {
		name: draft.name,
		setName: draft.rename,
		error: draft.error,
		creating: draft.creating,
		start: () => draft.reset((track?.title ?? '').slice(0, PLAYLIST_NAME_MAX)),
		submit: () => void submit(),
	};
}
