import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/playlistTypes';
import { usePlaylistDetailPage } from '@/features/playlists/features/editor/features/detail/hooks/usePlaylistDetailPage';
import { useHeaderSheetButton } from '@/features/playlists/features/editor/features/detail/hooks/useHeaderSheetButton';
import { useDetailHeader } from '@/features/playlists/features/editor/features/detail/hooks/useDetailHeader';
import { PlaylistDetailBody } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistDetailBody';
import { DetailHeaderButton } from '@/features/playlists/features/editor/features/detail/components/presenters/DetailHeaderButton';
import { DetailFallback } from '@/features/playlists/features/editor/features/detail/components/presenters/DetailFallback';
import type { TrackActionsSheetComponent } from '@/shared/playback/types/trackActionsSheetTypes';
import type {
	PlaybackActions,
	PlaylistPlayback,
} from '@/shared/playback/types/playbackActionsTypes';
import type { HeaderSheetButton } from '@/features/playlists/features/editor/features/detail/types/detailPageTypes';
import type { PlanState } from '@/features/subscription/subscriptionTypes';

type PlaylistDetailContainerProps = NativeStackScreenProps<
	PlaylistStackParamList,
	'PlaylistDetail'
> & {
	premium: Pick<PlanState, 'isPremium' | 'refetch'>;
	TrackActionsSheet: TrackActionsSheetComponent;
	playback: PlaybackActions & PlaylistPlayback;
};

function headerRightFor(button: HeaderSheetButton) {
	return () => <DetailHeaderButton {...button} />;
}

export function PlaylistDetailContainer({
	navigation,
	route,
	premium,
	TrackActionsSheet,
	playback,
}: PlaylistDetailContainerProps) {
	const page = usePlaylistDetailPage(navigation, route.params.id, { premium, playback });
	const { id, playlist } = page.screen;
	useDetailHeader(navigation, headerRightFor(useHeaderSheetButton(page.owner)));

	if (!playlist) return <DetailFallback screen={page.screen} />;
	return (
		<PlaylistDetailBody
			page={page}
			playlist={playlist}
			TrackActionsSheet={TrackActionsSheet}
			onAddTrack={() => navigation.navigate('SearchTracks', { playlistId: id })}
		/>
	);
}
