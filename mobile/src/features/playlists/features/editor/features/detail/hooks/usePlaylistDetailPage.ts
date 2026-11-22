import type { PlanState } from '@/features/subscription/subscriptionTypes';
import type {
	PlaybackActions,
	PlaylistPlayback,
} from '@/shared/playback/types/playbackActionsTypes';
import { useCoverActions } from '@/features/playlists/features/editor/shared/playlist-mutations/hooks/useCoverActions';
import { usePlaylistDetailScreen } from '@/features/playlists/features/editor/features/detail/hooks/usePlaylistDetailScreen';
import { usePlaylistTracks } from '@/features/playlists/features/editor/features/detail/hooks/usePlaylistTracks';
import { useOwnerActions } from '@/features/playlists/features/editor/features/detail/hooks/useOwnerActions';
import { usePlayPlaylist } from '@/features/playlists/features/editor/features/detail/hooks/usePlayPlaylist';
import { useCoverGradient } from '@/features/playlists/features/editor/features/detail/hooks/useCoverGradient';
import type { DetailNavigation } from '@/features/playlists/features/editor/features/detail/types/detailScreenTypes';
import type { DetailPage } from '@/features/playlists/features/editor/features/detail/types/detailPageTypes';

type DetailServices = {
	premium: Pick<PlanState, 'isPremium' | 'refetch'>;
	playback: PlaybackActions & PlaylistPlayback;
};

export function usePlaylistDetailPage(
	navigation: DetailNavigation,
	id: string,
	{ premium, playback }: DetailServices
): DetailPage {
	const screen = usePlaylistDetailScreen(navigation, id);

	return {
		screen,
		tracks: usePlaylistTracks(id, screen.playlist, playback),
		owner: useOwnerActions(navigation, screen),
		play: usePlayPlaylist(id, playback),
		gradient: useCoverGradient(screen.playlist),
		cover: useCoverActions(navigation, id, premium),
	};
}
