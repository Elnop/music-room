import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
	Playlist,
	PlaylistStackParamList,
} from '@/features/playlists/shared/playlist/playlistTypes';
import { useHomeScreen } from '@/features/playlists/features/browse/features/home/hooks/useHomeScreen';
import { HomeView } from '@/features/playlists/features/browse/features/home/components/presenters/HomeView';

type HomeOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'Home'> & {
	nearbyEvents?: React.ReactNode;
	similarProfiles?: React.ReactNode;
	onPlaylistActions: (playlist: Playlist) => (() => void) | undefined;
};

export function HomeContainer({
	navigation,
	nearbyEvents,
	similarProfiles,
	onPlaylistActions,
}: HomeOrchestratorProps) {
	const screen = useHomeScreen(navigation);
	return (
		<>
			<HomeView
				screen={screen}
				nearbyEvents={nearbyEvents}
				similarProfiles={similarProfiles}
				onPlaylistActions={onPlaylistActions}
			/>
		</>
	);
}
