import { Platform } from 'react-native';
import { getAppVersion } from './deviceService';
import { getDeviceName, getModelName } from './deviceIdentity';
import { getBackendUrl } from './backendUrl';
import { getAuthSession, getSession } from './authSession';

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		message: string;
		code: string;
		details?: unknown;
		why?: string;
		fix?: string;
	};
	meta: {
		timestamp: string;
	};
}

/** Sent by the backend in development and test only. */
interface ApiErrorDebug {
	why?: string;
	fix?: string;
}

/** `message` is safe to show; `why` and `fix` are for logs. */
export class ApiError extends Error {
	code: string;
	details?: unknown;
	status?: number;
	why?: string;
	fix?: string;

	constructor(
		message: string,
		code: string,
		details?: unknown,
		status?: number,
		debug: ApiErrorDebug = {}
	) {
		super(message);
		this.name = 'ApiError';
		this.code = code;
		this.details = details;
		this.status = status;
		this.why = debug.why;
		this.fix = debug.fix;
	}
}

function getClientHeaders(): Record<string, string> {
	return {
		'X-Platform': Platform.OS,
		'X-Device-Model': getModelName() || getDeviceName() || 'Unknown Device',
		'X-App-Version': getAppVersion(),
	};
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const url = `${getBackendUrl()}${endpoint}`;

	const makeRequest = async (authToken?: string): Promise<Response> => {
		// fetch sets a FormData body's multipart Content-Type, boundary included.
		const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
		const headers: Record<string, string> = {
			...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
		const authSession = getAuthSession();
		if (endpoint === '/api/auth/refresh' || !authSession) {
			return handleResponse<T>(await makeRequest());
		}

		const { isTokenExpiringSoon, refreshAccessToken } = authSession;
		const getAccessToken = () => getSession().accessToken || undefined;
		const accessToken = getAccessToken();

		if (accessToken && isTokenExpiringSoon()) {
			await refreshAccessToken();
			return handleResponse<T>(await makeRequest(getAccessToken()));
		}

		const response = await makeRequest(accessToken);

		// Signed out (a wrong password at login), a 401 is the backend's answer, not an expired token.
		if (response.status === 401 && accessToken) {
			if (!(await refreshAccessToken())) {
				throw new ApiError('Session expirée, reconnectez-vous.', 'SESSION_EXPIRED', undefined, 401);
			}
			return handleResponse<T>(await makeRequest(getAccessToken()));
		}

		return handleResponse<T>(response);
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}

		if (error instanceof Error) {
			throw new ApiError(error.message, 'NETWORK_ERROR');
		}

		throw new ApiError('Erreur inconnue', 'UNKNOWN_ERROR');
	}
}

/** The registered session's token, when there is one, takes precedence. */
export function authRequest<T>(
	endpoint: string,
	accessToken: string,
	options: RequestInit = {}
): Promise<T> {
	return apiRequest<T>(endpoint, {
		...options,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			...(options.headers as Record<string, string>),
		},
	});
}

async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		let errorCode = `HTTP_${response.status}`;
		let errorDetails: unknown = undefined;
		let debug: ApiErrorDebug = {};

		try {
			const errorData = await response.json();
			errorMessage = errorData.error?.message || errorData.message || errorMessage;
			errorCode = errorData.error?.code || errorCode;
			errorDetails = errorData.error?.details;
			debug = { why: errorData.error?.why, fix: errorData.error?.fix };
		} catch {
			try {
				const errorText = await response.text();
				errorMessage = errorText || errorMessage;
			} catch {
				// The status text stays the message.
			}
		}
		throw new ApiError(errorMessage, errorCode, errorDetails, response.status, debug);
	}

	let data: ApiResponse<T>;
	try {
		data = await response.json();
	} catch (parseError) {
		throw new ApiError('Réponse invalide du serveur', 'PARSE_ERROR', parseError, response.status);
	}

	if (!data.success || data.error) {
		throw new ApiError(
			data.error?.message || 'API request failed',
			data.error?.code || 'UNKNOWN_ERROR',
			data.error?.details,
			response.status,
			{ why: data.error?.why, fix: data.error?.fix }
		);
	}

	if (!data.data) {
		throw new ApiError('Réponse du serveur vide', 'NO_DATA', undefined, response.status);
	}

	return data.data;
}

const LOCAL_URI = /^(blob|data):/i;

export async function readLocalBlob(uri: string): Promise<Blob> {
	if (!LOCAL_URI.test(uri)) {
		throw new Error(`readLocalBlob only reads blob: and data: URIs, got "${uri.split(':')[0]}:"`);
	}
	return (await fetch(uri)).blob();
}
