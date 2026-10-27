import { useAlertStore } from '@/shared/stores/alertStore';
import { showAlert } from './alert.web';

beforeEach(() => useAlertStore.setState({ queue: [] }));

describe('showAlert (web)', () => {
	it('queues the alert for the dialog host, in order', () => {
		const buttons = [{ text: 'Annuler', style: 'cancel' as const }, { text: 'Supprimer' }];
		showAlert('Supprimer ?', 'Définitif.', buttons);
		showAlert('Erreur', 'Réessayez.', []);

		expect(useAlertStore.getState().queue).toEqual([
			{ title: 'Supprimer ?', message: 'Définitif.', buttons },
			{ title: 'Erreur', message: 'Réessayez.', buttons: [] },
		]);
	});
});
