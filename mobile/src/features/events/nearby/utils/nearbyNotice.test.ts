import { Platform } from 'react-native';
import { nearbyNotice } from '@/features/events/nearby/utils/nearbyNotice';

afterEach(() => {
	jest.restoreAllMocks();
});

describe('nearbyNotice', () => {
	it('sends a refused phone to the system settings', () => {
		expect(nearbyNotice({ status: 'denied' })).toMatchObject({
			message: expect.stringContaining('sur votre téléphone'),
			action: 'settings',
		});
	});

	it('points a refused browser to the site settings, with no button', () => {
		jest.replaceProperty(Platform, 'OS', 'web');
		const notice = nearbyNotice({ status: 'denied' });

		expect(notice.message).toContain("barre d'adresse du navigateur");
		expect(notice.message).toContain('dans votre navigateur');
		expect(notice.action).toBeUndefined();
	});

	it('offers to ask in the browser too', () => {
		jest.replaceProperty(Platform, 'OS', 'web');
		expect(nearbyNotice({ status: 'needs-permission' }).action).toBe('request');
	});

	it('offers to search again when the browser gave no position in time', () => {
		expect(nearbyNotice({ status: 'timed-out' })).toMatchObject({
			message: expect.stringContaining('Position introuvable'),
			action: 'retry',
		});
	});
});
