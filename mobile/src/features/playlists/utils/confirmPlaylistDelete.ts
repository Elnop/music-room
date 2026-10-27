import { showAlert } from '@/shared/utils/alert';

/** Deleting a playlist removes it for all its members, so it always asks first. */
export function confirmPlaylistDelete(name: string, onConfirm: () => void): void {
	showAlert(
		'Supprimer la playlist ?',
		`« ${name} » sera supprimée pour tous ses membres. Cette action est définitive.`,
		[
			{ text: 'Annuler', style: 'cancel' },
			{ text: 'Supprimer', style: 'destructive', onPress: onConfirm },
		]
	);
}
