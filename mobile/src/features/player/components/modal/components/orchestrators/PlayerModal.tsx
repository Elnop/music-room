import React from 'react';
import { usePlayerModal } from '@/features/player/components/modal/hooks/usePlayerModal';
import { usePlayerModalGestures } from '@/features/player/components/modal/hooks/usePlayerModalGestures';
import { PlayerModalView } from '@/features/player/components/modal/components/presenters/PlayerModalView';

export function PlayerModal() {
	const modal = usePlayerModal();
	const gestures = usePlayerModalGestures(modal.isModalOpen, modal.closeModal);

	return <PlayerModalView modal={modal} gestures={gestures} />;
}
