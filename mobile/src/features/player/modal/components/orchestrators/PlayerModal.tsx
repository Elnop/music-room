import React from 'react';
import { usePlayerModal } from '@/features/player/modal/hooks/usePlayerModal';
import { usePlayerModalGestures } from '@/features/player/modal/hooks/usePlayerModalGestures';
import { useSeekPosition } from '@/features/player/modal/hooks/useSeekPosition';
import { useArtworkCarousel } from '@/features/player/modal/hooks/useArtworkCarousel';
import { PlayerModalView } from '@/features/player/modal/components/presenters/PlayerModalView';

export function PlayerModal() {
	const modal = usePlayerModal();
	const gestures = usePlayerModalGestures(modal.isModalOpen, modal.closeModal);
	const seek = useSeekPosition(modal.currentTime, modal.handleSeek);
	const carousel = useArtworkCarousel(modal.track?.id ?? null);

	return <PlayerModalView modal={modal} gestures={gestures} seek={seek} carousel={carousel} />;
}
