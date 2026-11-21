import { pickImage } from '@/shared/image-picker/pickImage';
import { prepareSquareImage } from '@/shared/square-image/prepareSquareImage';
import { showError } from '@/shared/theme/lib/toast';
import * as playlistCoverApi from '@/features/playlists/features/editor/shared/playlist-mutations/lib/playlistCoverApi';
import type { CoverTask } from '@/features/playlists/features/editor/shared/playlist-mutations/types/coverActionsTypes';

const PERMISSION_DENIED =
	"Autorisez l'accès à vos photos dans les réglages pour choisir une cover.";

export async function pickUploadTask(playlistId: string): Promise<CoverTask | null> {
	const asset = await pickImage('library', () => showError(PERMISSION_DENIED));
	if (!asset) return null;
	return {
		run: async () => {
			const uri = await prepareSquareImage(asset);
			return (await playlistCoverApi.uploadCover(playlistId, uri)).coverUrl;
		},
		done: 'Cover mise à jour',
		fallback: 'Impossible de changer la cover',
	};
}

export function removeTask(playlistId: string): CoverTask {
	return {
		run: async () => (await playlistCoverApi.removeCover(playlistId)).coverUrl,
		done: 'Cover retirée',
		fallback: 'Impossible de retirer la cover',
	};
}
