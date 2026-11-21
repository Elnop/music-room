import React from 'react';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/playerSheetsTypes';
import { usePlayerBar } from '@/features/playback/features/player-bar/hooks/usePlayerBar';
import { PlayerBarView } from '@/features/playback/features/player-bar/components/presenters/PlayerBarView';

type PlayerBarContainerProps = PlayerSheets;

export function PlayerBarContainer(sheets: PlayerBarContainerProps) {
	const data = usePlayerBar();
	return <PlayerBarView data={data} {...sheets} />;
}
