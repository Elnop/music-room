import React, { useLayoutEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { useLibraryScreen } from '@/features/playlists/library/useLibraryScreen';
import { LibraryView } from './LibraryView';
import { HeaderIconButton } from '@/features/playlists/header/HeaderIconButton';
import { usePlaylistCardMenu } from '@/features/playlists/cardMenu/usePlaylistCardMenu';
import { PlaylistCardMenuContainer } from '@/features/playlists/cardMenu/PlaylistCardMenuContainer';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';
import type { PlanState } from '@/features/subscription/lib/subscription';

type LibraryOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'Playlists'> & {
	premium: Pick<PlanState, 'isPremium' | 'refetch'>;
};

export function LibraryContainer({ navigation, premium }: LibraryOrchestratorProps) {
	const screen = useLibraryScreen(navigation);
	const { createPlaylist } = screen;
	const menu = usePlaylistCardMenu(navigation, premium);

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

	return (
		<>
			<LibraryView screen={screen} actionsFor={menu.actionsFor} />
			<PlaylistCardMenuContainer menu={menu} />
		</>
	);
}
