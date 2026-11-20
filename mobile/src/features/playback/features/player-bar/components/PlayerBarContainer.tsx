import React from 'react';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';
import { usePlayerBar } from '@/features/playback/features/player-bar/usePlayerBar';
import { PlayerBarView } from '@/features/playback/features/player-bar/components/presenters/PlayerBarView';

export function PlayerBarContainer(sheets: PlayerSheets) {
	const data = usePlayerBar();
	return <PlayerBarView data={data} {...sheets} />;
}
