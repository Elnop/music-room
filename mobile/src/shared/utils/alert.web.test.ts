import { showAlert } from './alert.web';

const browser = globalThis as unknown as { alert: jest.Mock; confirm: jest.Mock };

beforeEach(() => {
	browser.alert = jest.fn();
	browser.confirm = jest.fn();
});

describe('showAlert (web)', () => {
	const cancel = { text: 'Annuler', style: 'cancel' as const, onPress: jest.fn() };

	beforeEach(() => cancel.onPress.mockClear());

	it('runs the single action once the browser confirms', () => {
		const remove = jest.fn();
		browser.confirm.mockReturnValue(true);
		showAlert('Supprimer ?', 'Définitif.', [cancel, { text: 'Supprimer', onPress: remove }]);
		expect(browser.confirm).toHaveBeenCalledWith('Supprimer ?\n\nDéfinitif.');
		expect(remove).toHaveBeenCalled();
		expect(cancel.onPress).not.toHaveBeenCalled();
	});

	it('runs the cancel button when the browser dialog is dismissed', () => {
		const remove = jest.fn();
		browser.confirm.mockReturnValue(false);
		showAlert('Supprimer ?', 'Définitif.', [cancel, { text: 'Supprimer', onPress: remove }]);
		expect(remove).not.toHaveBeenCalled();
		expect(cancel.onPress).toHaveBeenCalled();
	});

	it('asks for each action in turn and runs the first one accepted', () => {
		const library = jest.fn();
		const camera = jest.fn();
		browser.confirm.mockReturnValueOnce(false).mockReturnValueOnce(true);
		showAlert('Photo', 'Choisissez.', [
			{ text: 'Galerie', onPress: library },
			{ text: 'Appareil photo', onPress: camera },
			cancel,
		]);
		expect(browser.confirm).toHaveBeenLastCalledWith('Photo\n\nChoisissez.\n\nAppareil photo ?');
		expect(library).not.toHaveBeenCalled();
		expect(camera).toHaveBeenCalled();
	});

	it('only informs when there is nothing to choose', () => {
		showAlert('Réservé au Premium', 'Activez-le.', [cancel]);
		expect(browser.alert).toHaveBeenCalledWith('Réservé au Premium\n\nActivez-le.');
		expect(browser.confirm).not.toHaveBeenCalled();
	});
});
