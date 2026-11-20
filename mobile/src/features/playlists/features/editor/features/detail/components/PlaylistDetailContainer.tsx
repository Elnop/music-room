import React from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAnchoredPress } from '@/features/playlists/features/editor/features/detail/hooks/useAnchoredPress';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useSession } from '@/shared/backend/lib/authSession';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/lib/types';
import { usePlaylistDetailScreen } from '@/features/playlists/features/editor/features/detail/hooks/usePlaylistDetailScreen';
import { usePlaylistTracks } from '@/features/playlists/features/editor/features/detail/hooks/usePlaylistTracks';
import { useOwnerActions } from '@/features/playlists/features/editor/features/detail/hooks/useOwnerActions';
import { useCoverActions } from '@/features/playlists/features/editor/shared/cover-actions/useCoverActions';
import { usePlayPlaylist } from '@/features/playlists/features/editor/features/detail/hooks/usePlayPlaylist';
import { useCoverGradient } from '@/features/playlists/features/editor/features/detail/hooks/useCoverGradient';
import { PlaylistDetailView } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistDetailView';
import { PlaylistHeader } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistHeader';
import { PlaylistWideHeader } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistWideHeader';
import { PlayPlaylistButton } from '@/features/playlists/features/editor/features/detail/components/presenters/PlayPlaylistButton';
import { DetailSkeleton } from '@/features/playlists/features/editor/features/detail/components/presenters/DetailSkeleton';
import { LoadFailure } from '@/features/playlists/features/editor/features/detail/components/presenters/LoadFailure';
import {
	HeaderIconButton,
	headerButtonStyles,
} from '@/features/playlists/shared/header-button/HeaderIconButton';
import type { TrackActionsSheetComponent } from '@/shared/playback/lib/trackActionsSheet';
import { PlaylistActionsSheetContainer } from '@/features/playlists/features/editor/shared/action-sheet/components/PlaylistActionsSheetContainer';
import EllipsesHorizontalSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/ellipses-horizontal-solid.svg';
import type { PlanState } from '@/features/subscription/lib/subscription';

type PlaylistDetailOrchestratorProps = NativeStackScreenProps<
	PlaylistStackParamList,
	'PlaylistDetail'
> & {
	premium: Pick<PlanState, 'isPremium' | 'refetch'>;
	TrackActionsSheet: TrackActionsSheetComponent;
};

export function PlaylistDetailContainer({
	navigation,
	route,
	premium,
	TrackActionsSheet,
}: PlaylistDetailOrchestratorProps) {
	const screen = usePlaylistDetailScreen(navigation, route.params.id);
	const { id, playlist } = screen;
	const userId = useSession(session => session.user?.id);
	const tracks = usePlaylistTracks(id, playlist);
	const owner = useOwnerActions(navigation, screen);
	const play = usePlayPlaylist(id);
	const gradient = useCoverGradient(playlist);
	const isOwner = !!userId && playlist?.ownerId === userId;
	const cover = useCoverActions(navigation, id, premium);
	const Header = useBreakpoint().isWide ? PlaylistWideHeader : PlaylistHeader;
	const sheetButtonRef = React.useRef<View>(null);
	const openSheet = useAnchoredPress(sheetButtonRef, owner.openSheet);

	// headerRight stays set (empty for a non-owner): adding or removing the native header
	// subview while the screen re-attaches crashes Android ("child already has a parent").
	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerTransparent: true,
			headerTitle: '',
			headerRight: () => (
				<View style={headerButtonStyles.button}>
					{isOwner ? (
						<HeaderIconButton
							ref={sheetButtonRef}
							icon={EllipsesHorizontalSolid}
							size={24}
							onPress={openSheet}
							accessibilityLabel="Options de la playlist"
						/>
					) : null}
				</View>
			),
		});
	}, [navigation, isOwner, openSheet, sheetButtonRef]);

	if (!playlist) {
		return screen.failure ? (
			<LoadFailure notFound={screen.failure === 'notFound'} onRetry={screen.retry} />
		) : (
			<DetailSkeleton />
		);
	}

	return (
		<>
			<PlaylistDetailView
				playlist={playlist}
				tracks={tracks}
				gradient={gradient}
				isRefreshing={screen.isRefreshing}
				onRefresh={screen.refresh}
				bottomPadding={screen.bottomPadding}
				onPlayTrack={play.playFrom}
				pendingTrackId={play.pendingTrackId}
				header={
					<Header
						playlist={playlist}
						canEdit={tracks.canEdit}
						onAddTrack={() => navigation.navigate('SearchTracks', { playlistId: id })}
						playButton={<PlayPlaylistButton play={play} />}
					/>
				}
			/>
			<TrackActionsSheet track={tracks.actionTrack} onClose={tracks.closeActions} />
			{isOwner && (
				<PlaylistActionsSheetContainer
					visible={owner.sheetVisible}
					playlistName={playlist.name}
					onClose={owner.closeSheet}
					onEdit={owner.edit}
					onSharing={owner.sharing}
					onDelete={owner.remove}
					hasCover={!!playlist.coverUrl}
					coverLocked={!cover.isPremium}
					onChangeCover={cover.change}
					onRemoveCover={cover.remove}
				/>
			)}
		</>
	);
}
