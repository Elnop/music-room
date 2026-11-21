import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { useCreatePlaylist } from '@/features/playlists/features/editor/shared/playlist-mutations/hooks/usePlaylistMutations';
import { useAddTrack } from '@/features/playlists/features/editor/shared/track-edits/useTrackEdits';
import type {
	DraftState,
	NewPlaylistContext,
} from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';

export function useNewPlaylistContext(draft: DraftState, onClose: () => void): NewPlaylistContext {
	const client = useQueryClient();
	const create = useCreatePlaylist();
	const addTrack = useAddTrack();

	return {
		draft,
		create: create.mutateAsync,
		addTrack: addTrack.mutateAsync,
		onClose,
		refreshList: () => void client.invalidateQueries({ queryKey: queryKeys.playlists.list() }),
	};
}
