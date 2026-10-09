import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { LoginInput, RegisterInput } from '@utils/validators';
import type { UserProfile } from '@/types/user.types';
import { getAppVersion } from '@/services/deviceService';
import { getBackendUrl } from '@/services/backendUrl';

/**
 * Standard API Response format (matches backend)
 */
interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		message: string;
		code: string;
		details?: unknown;
	};
	meta: {
		timestamp: string;
	};
}

/**
 * Auth response from backend
 */
export interface AuthResponse {
	user: UserProfile;
	session?: {
		accessToken: string;
		refreshToken: string;
		expiresIn: number;
		expiresAt: number;
	};
	requiresVerification?: boolean;
	message?: string;
}

/**
 * API Error class
 */
export class ApiError extends Error {
	code: string;
	details?: unknown;
	/** HTTP status when the server answered with an error status */
	status?: number;

	constructor(message: string, code: string, details?: unknown, status?: number) {
		super(message);
		this.name = 'ApiError';
		this.code = code;
		this.details = details;
		this.status = status;
	}
}

/**
 * Get client metadata headers for action logging
 */
function getClientHeaders(): Record<string, string> {
	const appVersion = getAppVersion();

	const headers = {
		'X-Platform': Platform.OS,
		'X-Device-Model': Device.modelName || Device.deviceName || 'Unknown Device',
		'X-App-Version': appVersion,
	};

	if (__DEV__) {
		console.log('[API] Client headers:', {
			platform: Platform.OS,
			deviceModelName: Device.modelName,
			deviceName: Device.deviceName,
			expoConfigVersion: Constants.expoConfig?.version,
			manifestVersion: Constants.manifest?.version,
			manifest2Version: Constants.manifest2?.extra?.expoClient?.version,
			finalAppVersion: appVersion,
			headers,
		});
	}

	return headers;
}

/**
 * Session hooks the auth store registers at load time. A static import of the
 * store here would be circular, and a dynamic `import()` makes Metro load a
 * separate bundle whose HMR registration reloads the app in development.
 */
export interface AuthSession {
	getAccessToken: () => string | null;
	isTokenExpiringSoon: () => boolean;
	refreshAccessToken: () => Promise<boolean>;
}

let authSession: AuthSession | null = null;

export function registerAuthSession(session: AuthSession): void {
	authSession = session;
}

/**
 * Make API request with automatic token refresh on 401.
 * The backend address is read at call time (services/backendUrl.ts).
 */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const url = `${getBackendUrl()}${endpoint}`;

	const makeRequest = async (authToken?: string): Promise<Response> => {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...getClientHeaders(),
			...(options.headers as Record<string, string>),
		};

		if (authToken) {
			headers['Authorization'] = `Bearer ${authToken}`;
		}

		return fetch(url, {
			...options,
			headers,
		});
	};

	try {
		if (endpoint === '/api/auth/refresh') {
			console.log('[API] Skipping interceptor for /refresh endpoint');
			const response = await makeRequest();
			return handleResponse<T>(response);
		}

		if (!authSession) {
			const response = await makeRequest();
			return handleResponse<T>(response);
		}

		const { getAccessToken, isTokenExpiringSoon, refreshAccessToken } = authSession;
		const accessToken = getAccessToken();

		if (accessToken && isTokenExpiringSoon()) {
			console.log('[API] Token expiring soon, proactively refreshing...');
			await refreshAccessToken();

			const response = await makeRequest(getAccessToken() || undefined);
			return handleResponse<T>(response);
		}

		const response = await makeRequest(accessToken || undefined);

		if (response.status === 401) {
			console.log('[API] Received 401, attempting token refresh...');

			const refreshSuccess = await refreshAccessToken();

			if (!refreshSuccess) {
				throw new ApiError('Session expired. Please login again.', 'SESSION_EXPIRED');
			}

			const newAccessToken = getAccessToken();
			const retryResponse = await makeRequest(newAccessToken || undefined);

			return handleResponse<T>(retryResponse);
		}

		return handleResponse<T>(response);
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}

		if (error instanceof Error) {
			throw new ApiError(error.message, 'NETWORK_ERROR');
		}

		throw new ApiError('Unknown error occurred', 'UNKNOWN_ERROR');
	}
}

/**
 * Handle response parsing and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		let errorCode = `HTTP_${response.status}`;
		let errorDetails: unknown = undefined;

		try {
			const errorData = await response.json();
			errorMessage = errorData.error?.message || errorData.message || errorMessage;
			errorCode = errorData.error?.code || errorCode;
			errorDetails = errorData.error?.details;
		} catch {
			try {
				const errorText = await response.text();
				errorMessage = errorText || errorMessage;
			} catch {
				// Ignore text parsing errors
			}
		}
		throw new ApiError(errorMessage, errorCode, errorDetails, response.status);
	}

	let data: ApiResponse<T>;
	try {
		data = await response.json();
	} catch (parseError) {
		throw new ApiError('Invalid JSON response from server', 'PARSE_ERROR', parseError);
	}

	if (!data.success || data.error) {
		throw new ApiError(
			data.error?.message || 'API request failed',
			data.error?.code || 'UNKNOWN_ERROR',
			data.error?.details
		);
	}

	if (!data.data) {
		throw new ApiError('No data in response', 'NO_DATA');
	}

	return data.data;
}

/**
 * Auth API
 */
export const authApi = {
	/**
	 * Register new user
	 */
	async register(data: RegisterInput): Promise<AuthResponse> {
		return apiRequest<AuthResponse>('/api/auth/register', {
			method: 'POST',
			body: JSON.stringify({
				email: data.email,
				password: data.password,
				username: data.username,
				displayName: data.displayName,
			}),
		});
	},

	/**
	 * Login user
	 */
	async login(data: LoginInput): Promise<AuthResponse> {
		return apiRequest<AuthResponse>('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify({
				email: data.email,
				password: data.password,
			}),
		});
	},

	/**
	 * Get current user profile
	 */
	async getMe(accessToken: string): Promise<UserProfile> {
		return apiRequest<UserProfile>('/api/auth/me', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
	},

	/**
	 * Refresh access token
	 */
	async refreshToken(refreshToken: string): Promise<AuthResponse> {
		return apiRequest<AuthResponse>('/api/auth/refresh', {
			method: 'POST',
			body: JSON.stringify({
				refreshToken,
			}),
		});
	},

	/**
	 * Logout user
	 */
	async logout(accessToken: string): Promise<void> {
		await apiRequest<void>('/api/auth/logout', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
	},

	/**
	 * Login with Google OAuth
	 */
	async loginWithGoogle(idToken: string): Promise<AuthResponse> {
		return apiRequest<AuthResponse>('/api/auth/google', {
			method: 'POST',
			body: JSON.stringify({
				idToken,
			}),
		});
	},

	/**
	 * Login with Facebook OAuth
	 */
	async loginWithFacebook(accessToken: string): Promise<AuthResponse> {
		return apiRequest<AuthResponse>('/api/auth/facebook', {
			method: 'POST',
			body: JSON.stringify({
				accessToken,
			}),
		});
	},

	/**
	 * Get linked authentication providers
	 */
	async getLinkedProviders(accessToken: string): Promise<{
		providers: {
			type: 'password' | 'google' | 'facebook';
			connectedAt: string;
			isPrimary: boolean;
		}[];
	}> {
		return apiRequest('/api/auth/providers', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
	},

	/**
	 * Unlink an OAuth provider
	 */
	async unlinkProvider(
		accessToken: string,
		provider: 'google' | 'facebook'
	): Promise<{ message: string }> {
		return apiRequest(`/api/auth/providers/${provider}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
	},

	/**
	 * Verify email with 6-digit code
	 */
	async verifyEmail(userId: string, code: string): Promise<AuthResponse> {
		return apiRequest<AuthResponse>('/api/auth/verify-email', {
			method: 'POST',
			body: JSON.stringify({
				userId,
				code,
			}),
		});
	},

	/**
	 * Resend verification code
	 */
	async resendVerificationCode(userId: string, email: string): Promise<{ message: string }> {
		return apiRequest('/api/auth/resend-verification', {
			method: 'POST',
			body: JSON.stringify({
				userId,
				email,
			}),
		});
	},

	/**
	 * Request password reset (send email with code)
	 */
	async forgotPassword(email: string): Promise<{ message: string }> {
		return apiRequest('/api/auth/forgot-password', {
			method: 'POST',
			body: JSON.stringify({ email }),
		});
	},

	/**
	 * Reset password with code
	 */
	async resetPassword(
		email: string,
		code: string,
		newPassword: string
	): Promise<{ message: string }> {
		return apiRequest('/api/auth/reset-password', {
			method: 'POST',
			body: JSON.stringify({
				email,
				code,
				newPassword,
			}),
		});
	},

	/**
	 * Check if user can resend reset code
	 */
	async canResendResetCode(
		email: string
	): Promise<{ canResend: boolean; remainingSeconds: number }> {
		return apiRequest(`/api/auth/reset-password/can-resend?email=${encodeURIComponent(email)}`, {
			method: 'GET',
		});
	},
};
