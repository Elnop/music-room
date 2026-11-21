import { ApiError } from '@/shared/backend/lib/api';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { patchPlaylist } from '@/features/playlists/features/editor/shared/playlist-mutations/lib/playlistCacheEdits';
import { showCoverLocked } from '@/features/playlists/features/editor/shared/playlist-mutations/lib/showCoverLocked';
import type {
	CoverContext,
	CoverTask,
} from '@/features/playlists/features/editor/shared/playlist-mutations/types/coverActionsTypes';

export async function runCoverTask(context: CoverContext, task: CoverTask): Promise<void> {
	try {
		const coverUrl = await task.run();
		patchPlaylist(context.client, context.playlistId, { coverUrl: coverUrl ?? undefined });
		showSuccess(task.done);
	} catch (error) {
		if (error instanceof ApiError && error.code === 'PREMIUM_REQUIRED') {
			context.refetchPlan();
			showCoverLocked(context.navigation);
			return;
		}
		showError(apiErrorMessage(error, task.fallback));
	}
}
