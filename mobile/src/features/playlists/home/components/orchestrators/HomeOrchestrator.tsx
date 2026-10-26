import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { useHomeScreen } from '@/features/playlists/home/hooks/useHomeScreen';
import { HomeView } from '@/features/playlists/home/components/presenters/HomeView';

type HomeOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'Home'> & {
	/** The nearby events section, from another feature: the navigation layer passes it in. */
	nearbyEvents?: React.ReactNode;
};

export function HomeOrchestrator({ navigation, nearbyEvents }: HomeOrchestratorProps) {
	const screen = useHomeScreen(navigation);
	return <HomeView screen={screen} nearbyEvents={nearbyEvents} />;
}
