import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { runCoverTask } from '@/features/playlists/features/editor/shared/playlist-mutations/lib/runCoverTask';
import type {
	CoverContext,
	CoverTask,
} from '@/features/playlists/features/editor/shared/playlist-mutations/types/coverActionsTypes';

export function useCoverTask(context: Omit<CoverContext, 'client'>) {
	const client = useQueryClient();
	const [isUploading, setIsUploading] = useState(false);

	async function perform(load: () => CoverTask | Promise<CoverTask | null>) {
		if (isUploading) return;
		const task = await load();
		if (!task) return;
		setIsUploading(true);
		try {
			await runCoverTask({ ...context, client }, task);
		} finally {
			setIsUploading(false);
		}
	}

	return { isUploading, perform };
}
