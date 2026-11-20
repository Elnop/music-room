import React from 'react';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';
import { usePlayerModal } from '@/features/playback/features/player-modal/hooks/usePlayerModal';
import { usePlayerModalGestures } from '@/features/playback/features/player-modal/hooks/usePlayerModalGestures';
import { useSeekPosition } from '@/features/playback/shared/seek-bar/useSeekPosition';
import { useArtworkCarousel } from '@/features/playback/features/player-modal/hooks/useArtworkCarousel';
import { PlayerModalView } from '@/features/playback/features/player-modal/components/presenters/PlayerModalView';

export function PlayerModalContainer(sheets: PlayerSheets) {
	const modal = usePlayerModal();
	const gestures = usePlayerModalGestures(modal.isModalOpen, modal.closeModal);
	const seek = useSeekPosition(modal.currentTime, modal.handleSeek);
	const carousel = useArtworkCarousel(modal.track, modal.artworkUrl);

	return (
		<PlayerModalView
			modal={modal}
			gestures={gestures}
			seek={seek}
			carousel={carousel}
			{...sheets}
		/>
	);
}
