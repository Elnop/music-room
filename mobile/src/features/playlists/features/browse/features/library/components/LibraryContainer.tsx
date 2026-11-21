import React, { useLayoutEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
	Playlist,
	PlaylistStackParamList,
} from '@/features/playlists/shared/playlist/playlistTypes';
import { useLibraryScreen } from '@/features/playlists/features/browse/features/library/useLibraryScreen';
import { LibraryView } from '@/features/playlists/features/browse/features/library/components/presenters/LibraryView';
import { HeaderIconButton } from '@/features/playlists/shared/header-button/HeaderIconButton';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';

type LibraryOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'Playlists'> & {
	onPlaylistActions: (playlist: Playlist) => (() => void) | undefined;
};

function createPlaylistHeader(onCreate: () => void) {
	return function headerRight() {
		return (
			<HeaderIconButton
				icon={PlusSolid}
				size={28}
				onPress={onCreate}
				accessibilityLabel="Créer une playlist"
			/>
		);
	};
}

export function LibraryContainer({ navigation, onPlaylistActions }: LibraryOrchestratorProps) {
	const screen = useLibraryScreen(navigation);
	const { createPlaylist } = screen;

	useLayoutEffect(() => {
		navigation.setOptions({ headerRight: createPlaylistHeader(createPlaylist) });
	}, [navigation, createPlaylist]);

	return <LibraryView screen={screen} onPlaylistActions={onPlaylistActions} />;
}
