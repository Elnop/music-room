import { useAlertStore } from '@/shared/alerts/alertStore';
import { showAlert } from '@/shared/alerts/alert.web';

beforeEach(() => useAlertStore.setState({ queue: [] }));

describe('showAlert (web)', () => {
	it('queues the alert for the dialog host, in order', () => {
		const buttons = [{ text: 'Annuler', style: 'cancel' as const }, { text: 'Supprimer' }];
		showAlert('Supprimer ?', 'Définitif.', buttons);
		showAlert('Erreur', 'Réessayez.', []);

		expect(useAlertStore.getState().queue).toStrictEqual([
			{ title: 'Supprimer ?', message: 'Définitif.', buttons },
			{ title: 'Erreur', message: 'Réessayez.', buttons: [] },
		]);
	});
});
