import React from 'react';
import { Platform } from 'react-native';
import { KeyboardShortcuts } from '@/app/KeyboardShortcuts';
import { PlayerModalContainer } from '@/features/playback/features/player-modal/components/orchestrators/PlayerModalContainer';
import { PlayerErrorToastContainer } from '@/features/playback/features/player-modal/components/orchestrators/PlayerErrorToastContainer';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';

type AppOverlaysProps = {
	sheets: PlayerSheets;
};

export function AppOverlays({ sheets }: AppOverlaysProps) {
	return (
		<>
			<PlayerModalContainer {...sheets} />
			<PlayerErrorToastContainer />
			{Platform.OS === 'web' && <KeyboardShortcuts />}
		</>
	);
}
