type Constants = typeof import('./platform');

function loadFor(os: string): Constants {
	let constants: Constants | undefined;
	jest.isolateModules(() => {
		jest.doMock('react-native', () => ({ Platform: { OS: os } }));
		constants = jest.requireActual<Constants>('./platform');
	});
	return constants as Constants;
}

describe('platform features', () => {
	it('keeps every native feature on Android', () => {
		expect(loadFor('android')).toEqual({
			BEACON_BROADCAST_AVAILABLE: true,
			THIS_DEVICE_LABEL: 'Ce téléphone',
			LANDING_SHOWN: false,
		});
	});

	it('hides what the browser cannot do', () => {
		expect(loadFor('web')).toEqual({
			BEACON_BROADCAST_AVAILABLE: false,
			THIS_DEVICE_LABEL: 'Ce navigateur',
			LANDING_SHOWN: true,
		});
	});
});
