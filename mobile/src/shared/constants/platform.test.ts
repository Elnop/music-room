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
			SOCIAL_SIGN_IN_AVAILABLE: true,
			BEACON_BROADCAST_AVAILABLE: true,
			BACKEND_URL_EDITABLE: true,
		});
	});

	it('hides what the browser cannot do', () => {
		expect(loadFor('web')).toEqual({
			SOCIAL_SIGN_IN_AVAILABLE: false,
			BEACON_BROADCAST_AVAILABLE: false,
			BACKEND_URL_EDITABLE: false,
		});
	});
});
