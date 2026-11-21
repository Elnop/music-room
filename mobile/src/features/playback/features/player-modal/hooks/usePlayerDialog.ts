import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { isPlayerDialog } from '@/features/playback/features/player-modal/lib/playerLayout';

export function usePlayerDialog(isModalOpen: boolean) {
	const { isDesktop, width } = useBreakpoint();
	return { dialog: isPlayerDialog(width), visible: isModalOpen && !isDesktop };
}
