import React, { useLayoutEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { usePlaylistsScreen } from '@/features/playlists/list/hooks/usePlaylistsScreen';
import { PlaylistsView } from '@/features/playlists/list/components/presenters/PlaylistsView';
import { HeaderIconButton } from '@/features/playlists/header/components/presenters/HeaderIconButton';

type PlaylistsOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'Playlists'>;

export function PlaylistsOrchestrator({ navigation }: PlaylistsOrchestratorProps) {
	const screen = usePlaylistsScreen(navigation);
	const { createPlaylist } = screen;

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

	return <PlaylistsView screen={screen} />;
}
