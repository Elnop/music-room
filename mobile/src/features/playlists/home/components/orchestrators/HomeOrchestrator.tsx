import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { useHomeScreen } from '@/features/playlists/home/hooks/useHomeScreen';
import { HomeView } from '@/features/playlists/home/components/presenters/HomeView';
import { usePlaylistCardMenu } from '@/features/playlists/cardMenu/hooks/usePlaylistCardMenu';
import { PlaylistCardMenu } from '@/features/playlists/cardMenu/components/orchestrators/PlaylistCardMenu';

type HomeOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'Home'> & {
	/** The nearby events section, from another feature: the navigation layer passes it in. */
	nearbyEvents?: React.ReactNode;
	/** The similar tastes profiles section, from the friends feature. */
	similarProfiles?: React.ReactNode;
};

export function HomeOrchestrator({
	navigation,
	nearbyEvents,
	similarProfiles,
}: HomeOrchestratorProps) {
	const screen = useHomeScreen(navigation);
	const menu = usePlaylistCardMenu(navigation);
	return (
		<>
			<HomeView
				screen={screen}
				nearbyEvents={nearbyEvents}
				similarProfiles={similarProfiles}
				actionsFor={menu.actionsFor}
			/>
			<PlaylistCardMenu menu={menu} />
		</>
	);
}
