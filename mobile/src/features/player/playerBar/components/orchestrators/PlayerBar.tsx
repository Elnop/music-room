import React from 'react';
import { usePlayerBar } from '@/features/player/playerBar/hooks/usePlayerBar';
import { PlayerBarView } from '@/features/player/playerBar/components/presenters/PlayerBarView';

export function PlayerBar() {
	const data = usePlayerBar();
	return <PlayerBarView data={data} />;
}
