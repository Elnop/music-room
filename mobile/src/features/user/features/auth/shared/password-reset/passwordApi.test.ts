import { apiRequest } from '@/shared/backend/lib/api';
import {
	forgotPassword,
	resetPassword,
} from '@/features/user/features/auth/shared/password-reset/passwordApi';

jest.mock('@/shared/backend/lib/api', () => ({ apiRequest: jest.fn() }));

function bodyOf(call: number): unknown {
	const init = jest.mocked(apiRequest).mock.calls[call][1] as RequestInit;
	return JSON.parse(init.body as string);
}

describe('passwordApi', () => {
	beforeEach(() => {
		jest.mocked(apiRequest).mockReset().mockResolvedValue({ message: 'ok' });
	});

	it('requests the code, then resets the password, through the backend only', async () => {
		await forgotPassword('a@example.com');
		await resetPassword('a@example.com', '123456', 'NewSecret1!');

		expect(apiRequest).toHaveBeenCalledTimes(2);
		expect(jest.mocked(apiRequest).mock.calls[0][0]).toBe('/api/auth/forgot-password');
		expect(bodyOf(0)).toStrictEqual({ email: 'a@example.com' });
		expect(jest.mocked(apiRequest).mock.calls[1][0]).toBe('/api/auth/reset-password');
		expect(bodyOf(1)).toStrictEqual({
			email: 'a@example.com',
			code: '123456',
			newPassword: 'NewSecret1!',
		});
	});
});
