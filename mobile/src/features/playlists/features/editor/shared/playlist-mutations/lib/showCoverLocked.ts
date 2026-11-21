import { showAlert } from '@/shared/alerts/showAlert';
import type { CoverNavigation } from '@/features/playlists/features/editor/shared/playlist-mutations/types/coverActionsTypes';

export function showCoverLocked(navigation: CoverNavigation) {
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
