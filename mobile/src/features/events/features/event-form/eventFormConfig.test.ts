import type * as EventFormConfigModule from '@/features/events/features/event-form/eventFormConfig';

type Constants = typeof EventFormConfigModule;

function loadFor(os: string): Constants {
	let constants: Constants | undefined;
	jest.isolateModules(() => {
		jest.doMock('react-native', () => ({ Platform: { OS: os } }));
		constants = jest.requireActual<Constants>(
			'@/features/events/features/event-form/eventFormConfig',
		);
	});
	return constants as Constants;
}

describe('event form config', () => {
	it('asks for the location permission on a phone, which geocodes on the device', () => {
		expect(loadFor('android').GEOCODER_NEEDS_LOCATION_PERMISSION).toBe(true);
	});

	it('needs no location permission on the web, which asks the backend', () => {
		expect(loadFor('web').GEOCODER_NEEDS_LOCATION_PERMISSION).toBe(false);
	});
});
