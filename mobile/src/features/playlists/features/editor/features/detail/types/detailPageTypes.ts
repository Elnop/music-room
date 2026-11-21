import type { Ref } from 'react';
import type { View } from 'react-native';
import type { CoverActions } from '@/features/playlists/features/editor/shared/playlist-mutations/types/coverActionsTypes';
import type {
	OwnerActions,
	PlaylistDetailScreen,
} from '@/features/playlists/features/editor/features/detail/types/detailScreenTypes';
import type { PlaylistTracks } from '@/features/playlists/features/editor/features/detail/types/playlistTracksTypes';
import type { PlayPlaylist } from '@/features/playlists/features/editor/features/detail/types/playPlaylistTypes';

export type GradientColors = readonly [string, string, ...string[]];

export type DetailPage = {
	screen: PlaylistDetailScreen;
	tracks: PlaylistTracks;
	owner: OwnerActions;
	play: PlayPlaylist;
	gradient: GradientColors;
	cover: CoverActions;
};

export type HeaderSheetButton = {
	visible: boolean;
	buttonRef: Ref<View>;
	onPress: () => void;
};
