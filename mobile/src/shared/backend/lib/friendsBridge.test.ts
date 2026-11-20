import { apiRequest, authRequest } from './api';
import { getFriends, registerFriendsBridge, resetFriendsBridge } from './friendsBridge';

jest.mock('./api', () => ({
	apiRequest: jest.fn(),
	authRequest: jest.fn(),
}));

describe('friendsBridge', () => {
	afterEach(() => {
		resetFriendsBridge();
		jest.clearAllMocks();
	});

	it('calls apiRequest when no bridge is registered and no token passed', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce([{ id: 'u1', username: 'alice' }]);
		const res = await getFriends();
		expect(apiRequest).toHaveBeenCalledWith('/api/friends');
		expect(res).toEqual([{ id: 'u1', username: 'alice' }]);
	});

	it('calls authRequest when no bridge is registered and token passed', async () => {
		jest.mocked(authRequest).mockResolvedValueOnce([{ id: 'u2', username: 'bob' }]);
		const res = await getFriends('token-123');
		expect(authRequest).toHaveBeenCalledWith('/api/friends', 'token-123');
		expect(res).toEqual([{ id: 'u2', username: 'bob' }]);
	});

	it('delegates to registered bridge when present', async () => {
		const customFn = jest.fn().mockResolvedValue([{ id: 'u3', username: 'carol' }]);
		registerFriendsBridge({ getFriends: customFn });

		const res = await getFriends('token-abc');
		expect(customFn).toHaveBeenCalledWith('token-abc');
		expect(res).toEqual([{ id: 'u3', username: 'carol' }]);
		expect(authRequest).not.toHaveBeenCalled();
	});
});
