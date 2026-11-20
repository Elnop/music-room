import React, { useLayoutEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
	Playlist,
	PlaylistStackParamList,
} from '@/features/playlists/shared/playlist/lib/types';
import { useLibraryScreen } from '@/features/playlists/features/browse/features/library/useLibraryScreen';
import { LibraryView } from './LibraryView';
import { HeaderIconButton } from '@/features/playlists/shared/header-button/HeaderIconButton';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';

type LibraryOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'Playlists'> & {
	actionsFor: (playlist: Playlist) => (() => void) | undefined;
};

export function LibraryContainer({ navigation, actionsFor }: LibraryOrchestratorProps) {
	const screen = useLibraryScreen(navigation);
	const { createPlaylist } = screen;

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<HeaderIconButton
					icon={PlusSolid}
					size={28}
					onPress={createPlaylist}
					accessibilityLabel="Créer une playlist"
				/>
			),
		});
	}, [navigation, createPlaylist]);

	return <LibraryView screen={screen} actionsFor={actionsFor} />;
}
