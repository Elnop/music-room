import { controlErrorMessage } from './controlError';

describe('controlErrorMessage', () => {
	it('translates NOT_AUTHORIZED', () => {
		expect(controlErrorMessage({ code: 'NOT_AUTHORIZED', message: 'x' })).toBe(
			'Vous ne pouvez pas contrôler cet appareil'
		);
	});

	it('translates DEVICE_OFFLINE', () => {
		expect(controlErrorMessage({ code: 'DEVICE_OFFLINE', message: 'x' })).toBe(
			"Cet appareil n'est plus en ligne"
		);
	});

	it('falls back on other errors', () => {
		expect(controlErrorMessage({ code: 'OTHER', message: 'Server says no' })).toBe(
			'La commande a échoué, réessayez'
		);
	});
});
