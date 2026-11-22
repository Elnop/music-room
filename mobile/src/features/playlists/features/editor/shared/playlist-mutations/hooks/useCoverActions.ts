import type { PlanState } from '@/features/subscription/subscriptionTypes';
import { showCoverLocked } from '@/features/playlists/features/editor/shared/playlist-mutations/lib/showCoverLocked';
import {
	pickUploadTask,
	removeTask,
} from '@/features/playlists/features/editor/shared/playlist-mutations/lib/coverTasks';
import { useCoverTask } from '@/features/playlists/features/editor/shared/playlist-mutations/hooks/useCoverTask';
import type {
	CoverActions,
	CoverNavigation,
} from '@/features/playlists/features/editor/shared/playlist-mutations/types/coverActionsTypes';

export function useCoverActions(
	navigation: CoverNavigation,
	playlistId: string,
	premium: Pick<PlanState, 'isPremium' | 'refetch'>
): CoverActions {
	const { isUploading, perform } = useCoverTask({
		playlistId,
		navigation,
		refetchPlan: premium.refetch,
	});

	async function pickTask() {
		if (premium.isPremium) return pickUploadTask(playlistId);
		showCoverLocked(navigation);
		return null;
	}

	return {
		isPremium: premium.isPremium,
		isUploading,
		change: () => void perform(pickTask),
		remove: () => void perform(() => removeTask(playlistId)),
	};
}
