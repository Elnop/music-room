import { useState } from 'react';
import { showAlert } from '@/shared/utils/alert';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/services/api';
import { usePlan } from '@/shared/hooks/usePlan';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { pickImage } from '@/shared/utils/imagePicker';
import { prepareSquareImage } from '@/shared/utils/squareImage';
import { showError, showSuccess } from '@/shared/utils/toast';
import * as playlistApi from '@/features/playlists/services/playlistApi';
import { patchPlaylist } from '@/features/playlists/utils/playlistCache';
import type { DetailNavigation } from './usePlaylistDetailScreen';

const PERMISSION_DENIED =
	"Autorisez l'accès à vos photos dans les réglages pour choisir une cover.";

interface CoverActions {
	/** False on the free plan: changing the cover shows the Premium lock instead. */
	isPremium: boolean;
	isUploading: boolean;
	change: () => void;
	remove: () => void;
}

/** Only the owner can change the cover: the plan is fetched for them alone. */
export function useCoverActions(
	navigation: DetailNavigation,
	playlistId: string,
	isOwner: boolean
): CoverActions {
	const client = useQueryClient();
	const { isPremium, refetch: refetchPlan } = usePlan({ enabled: isOwner });
	const [isUploading, setIsUploading] = useState(false);

	const showLocked = () =>
		showAlert(
			'Réservé au Premium',
			"Changer la cover d'une playlist est réservé à l'offre Premium. Vous pouvez l'activer dans les paramètres.",
			[
				{ text: 'Annuler', style: 'cancel' },
				{
					text: 'Paramètres',
					onPress: () =>
						navigation.getParent()?.navigate('ProfileTab', { screen: 'Settings', initial: false }),
				},
			]
		);

	const run = async (action: () => Promise<string | null>, done: string, fallback: string) => {
		setIsUploading(true);
		try {
			const coverUrl = await action();
			patchPlaylist(client, playlistId, { coverUrl: coverUrl ?? undefined });
			showSuccess(done);
		} catch (error) {
			if (error instanceof ApiError && error.code === 'PREMIUM_REQUIRED') {
				// Downgraded from another device: the cached plan is stale.
				void refetchPlan();
				showLocked();
				return;
			}
			showError(apiErrorMessage(error, fallback));
		} finally {
			setIsUploading(false);
		}
	};

	const change = async () => {
		if (isUploading) return;
		if (!isPremium) {
			showLocked();
			return;
		}
		const asset = await pickImage('library', PERMISSION_DENIED);
		if (!asset) return;
		await run(
			async () => {
				const uri = await prepareSquareImage(asset);
				return (await playlistApi.uploadCover(playlistId, uri)).coverUrl;
			},
			'Cover mise à jour',
			'Impossible de changer la cover'
		);
	};

	const remove = async () => {
		if (isUploading) return;
		await run(
			async () => (await playlistApi.removeCover(playlistId)).coverUrl,
			'Cover retirée',
			'Impossible de retirer la cover'
		);
	};

	return {
		isPremium,
		isUploading,
		change: () => void change(),
		remove: () => void remove(),
	};
}
