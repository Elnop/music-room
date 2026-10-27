import React, { useLayoutEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { useLibraryScreen } from '@/features/playlists/library/hooks/useLibraryScreen';
import { LibraryView } from '@/features/playlists/library/components/presenters/LibraryView';
import { HeaderIconButton } from '@/features/playlists/header/components/presenters/HeaderIconButton';
import { usePlaylistCardMenu } from '@/features/playlists/cardMenu/hooks/usePlaylistCardMenu';
import { PlaylistCardMenu } from '@/features/playlists/cardMenu/components/orchestrators/PlaylistCardMenu';

type LibraryOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'Playlists'>;

export function LibraryOrchestrator({ navigation }: LibraryOrchestratorProps) {
	const screen = useLibraryScreen(navigation);
	const { createPlaylist } = screen;
	const menu = usePlaylistCardMenu(navigation);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<HeaderIconButton
					icon="add"
					size={28}
					onPress={createPlaylist}
					accessibilityLabel="Créer une playlist"
				/>
			),
		});
	}, [navigation, createPlaylist]);

	return (
		<>
			<LibraryView screen={screen} actionsFor={menu.actionsFor} />
			<PlaylistCardMenu menu={menu} />
		</>
	);
}
