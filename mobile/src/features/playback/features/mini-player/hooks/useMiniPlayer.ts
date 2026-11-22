import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { useMiniPlayerControls } from '@/features/playback/features/mini-player/hooks/useMiniPlayerControls';
import { useMiniPlayerSwipe } from '@/features/playback/features/mini-player/hooks/useMiniPlayerSwipe';
import { miniPlayerSummary } from '@/features/playback/features/mini-player/lib/miniPlayerSummary';
import type { MiniPlayerData } from '@/features/playback/features/mini-player/miniPlayerTypes';

export function useMiniPlayer(): MiniPlayerData {
	const toggleModal = usePlayerState((state) => state.toggleModal);
	const setModalOpen = usePlayerState((state) => state.setModalOpen);
	const controls = useMiniPlayerControls();
	const swipe = useMiniPlayerSwipe({
		canGoNext: controls.canGoNext,
		canGoPrevious: controls.canGoPrevious,
		onNext: controls.onNext,
		onPrevious: controls.onPrevious,
		onOpen: () => setModalOpen(true),
	});
	return {
		...miniPlayerSummary(controls.nowPlaying),
		nextDisabled: !controls.canGoNext,
		onToggleModal: toggleModal,
		onTogglePlay: controls.onTogglePlay,
		onNext: controls.onNext,
		...swipe,
	};
}
