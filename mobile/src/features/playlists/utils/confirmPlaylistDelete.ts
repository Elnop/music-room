import { showAlert } from '@/shared/utils/alert';

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
