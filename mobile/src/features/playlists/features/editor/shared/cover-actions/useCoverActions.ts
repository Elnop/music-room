import { useState } from 'react';
import { showAlert } from '@/shared/alerts/showAlert';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/backend/lib/api';
import type { PlanState } from '@/features/subscription/lib/subscription';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { pickImage } from '@/shared/image-picker/pickImage';
import { prepareSquareImage } from '@/shared/square-image/prepareSquareImage';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import * as playlistApi from '@/features/playlists/shared/playlist/lib/playlistApi';
import { patchPlaylist } from '@/features/playlists/shared/playlist/lib/playlistCache';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/lib/types';

const PERMISSION_DENIED =
	"Autorisez l'accès à vos photos dans les réglages pour choisir une cover.";

type CoverActions = {
	isPremium: boolean;
	isUploading: boolean;
	change: () => void;
	remove: () => void;
};

export function useCoverActions(
	navigation: Pick<NativeStackNavigationProp<PlaylistStackParamList>, 'getParent'>,
	playlistId: string,
	premium: Pick<PlanState, 'isPremium' | 'refetch'>
): CoverActions {
	const client = useQueryClient();
	const { isPremium, refetch: refetchPlan } = premium;
	const [isUploading, setIsUploading] = useState(false);

	function showLocked() {
		return showAlert(
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
	}

	async function run(action: () => Promise<string | null>, done: string, fallback: string) {
		setIsUploading(true);
		try {
			const coverUrl = await action();
			patchPlaylist(client, playlistId, { coverUrl: coverUrl ?? undefined });
			showSuccess(done);
		} catch (error) {
			if (error instanceof ApiError && error.code === 'PREMIUM_REQUIRED') {
				refetchPlan();
				showLocked();
				return;
			}
			showError(apiErrorMessage(error, fallback));
		} finally {
			setIsUploading(false);
		}
	}

	async function change() {
		if (isUploading) return;
		if (!isPremium) {
			showLocked();
			return;
		}
		const asset = await pickImage('library', () => showError(PERMISSION_DENIED));
		if (!asset) return;
		await run(
			async () => {
				const uri = await prepareSquareImage(asset);
				return (await playlistApi.uploadCover(playlistId, uri)).coverUrl;
			},
			'Cover mise à jour',
			'Impossible de changer la cover'
		);
	}

	async function remove() {
		if (isUploading) return;
		await run(
			async () => (await playlistApi.removeCover(playlistId)).coverUrl,
			'Cover retirée',
			'Impossible de retirer la cover'
		);
	}

	return {
		isPremium,
		isUploading,
		change: () => void change(),
		remove: () => void remove(),
	};
}
