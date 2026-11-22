import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';

export function useModalOpen() {
	const isModalOpen = usePlayerState((state) => state.isModalOpen);
	const setModalOpen = usePlayerState((state) => state.setModalOpen);
	return { isModalOpen, closeModal: () => setModalOpen(false) };
}
