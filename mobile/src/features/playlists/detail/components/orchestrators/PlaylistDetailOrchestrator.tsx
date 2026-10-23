import React from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSession } from '@/shared/services/authSession';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { usePlaylistDetailScreen } from '@/features/playlists/detail/hooks/usePlaylistDetailScreen';
import { usePlaylistTracks } from '@/features/playlists/detail/hooks/usePlaylistTracks';
import { useOwnerActions } from '@/features/playlists/detail/hooks/useOwnerActions';
import { usePlayPlaylist } from '@/features/playlists/detail/hooks/usePlayPlaylist';
import { useCoverGradient } from '@/features/playlists/detail/hooks/useCoverGradient';
import { PlaylistDetailView } from '@/features/playlists/detail/components/presenters/PlaylistDetailView';
import { PlaylistHeader } from '@/features/playlists/detail/components/presenters/PlaylistHeader';
import { PlayPlaylistButton } from '@/features/playlists/detail/components/presenters/PlayPlaylistButton';
import { DetailSkeleton } from '@/features/playlists/detail/components/presenters/DetailSkeleton';
import { LoadFailure } from '@/features/playlists/detail/components/presenters/LoadFailure';
import {
	HeaderIconButton,
	headerButtonStyles,
} from '@/features/playlists/header/components/presenters/HeaderIconButton';
import { TrackActionsSheet } from '@/features/playlists/trackActions/components/orchestrators/TrackActionsSheet';
import { PlaylistActionsSheet } from './PlaylistActionsSheet';

type PlaylistDetailOrchestratorProps = NativeStackScreenProps<
	PlaylistStackParamList,
	'PlaylistDetail'
>;

export function PlaylistDetailOrchestrator({ navigation, route }: PlaylistDetailOrchestratorProps) {
	const screen = usePlaylistDetailScreen(navigation, route.params.id);
	const { id, playlist } = screen;
	const userId = useSession(session => session.user?.id);
	const tracks = usePlaylistTracks(id, playlist);
	const owner = useOwnerActions(navigation, screen);
	const play = usePlayPlaylist(id);
	const gradient = useCoverGradient(playlist);
	const isOwner = !!userId && playlist?.ownerId === userId;
	const { openSheet } = owner;

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
							icon="ellipsis-horizontal"
							size={24}
							onPress={openSheet}
							accessibilityLabel="Options de la playlist"
						/>
					) : null}
				</View>
			),
		});
	}, [navigation, isOwner, openSheet]);

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
				header={
					<PlaylistHeader
						playlist={playlist}
						canEdit={tracks.canEdit}
						onAddTrack={() => navigation.navigate('SearchTracks', { playlistId: id })}
						playButton={<PlayPlaylistButton play={play} />}
					/>
				}
			/>
			<TrackActionsSheet track={tracks.actionTrack} onClose={tracks.closeActions} />
			{isOwner && (
				<PlaylistActionsSheet
					visible={owner.sheetVisible}
					playlistName={playlist.name}
					onClose={owner.closeSheet}
					onEdit={owner.edit}
					onSharing={owner.sharing}
					onDelete={owner.remove}
				/>
			)}
		</>
	);
}
