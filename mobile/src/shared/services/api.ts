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
		/** Technical reason; sent by the backend in development and test only. */
		why?: string;
		/** Hint to fix it; sent by the backend in development and test only. */
		fix?: string;
	};
	meta: {
		timestamp: string;
	};
}

/** Developer context of an API error, sent by the backend in development and test only. */
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

/** The backend logs these with every action. */
function getClientHeaders(): Record<string, string> {
	const appVersion = getAppVersion();

	const headers = {
		'X-Platform': Platform.OS,
		'X-Device-Model': getModelName() || getDeviceName() || 'Unknown Device',
		'X-App-Version': appVersion,
	};

	return headers;
}

/** Refreshes the token on a 401; reads the backend address at call time. */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const url = `${getBackendUrl()}${endpoint}`;

	const makeRequest = async (authToken?: string): Promise<Response> => {
		// A FormData body gets its multipart Content-Type (with the boundary) from fetch.
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
		if (endpoint === '/api/auth/refresh') {
			const response = await makeRequest();
			return handleResponse<T>(response);
		}

		const authSession = getAuthSession();
		if (!authSession) {
			const response = await makeRequest();
			return handleResponse<T>(response);
		}

		const { isTokenExpiringSoon, refreshAccessToken } = authSession;
		const getAccessToken = () => getSession().accessToken;
		const accessToken = getAccessToken();

		if (accessToken && isTokenExpiringSoon()) {
			await refreshAccessToken();

			const response = await makeRequest(getAccessToken() || undefined);
			return handleResponse<T>(response);
		}

		const response = await makeRequest(accessToken || undefined);

		// Refresh only when a session exists: signed out (e.g. a wrong password
		// at login), the 401 is the backend's answer, not an expired token.
		if (response.status === 401 && accessToken) {
			const refreshSuccess = await refreshAccessToken();

			if (!refreshSuccess) {
				throw new ApiError('Session expirée, reconnectez-vous.', 'SESSION_EXPIRED', undefined, 401);
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
				// Ignore text parsing errors
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

/** Reads a picked or manipulated image (blob: or data: URI) in the browser; refuses any network URL. */
export async function readLocalBlob(uri: string): Promise<Blob> {
	if (!LOCAL_URI.test(uri)) {
		throw new Error(`readLocalBlob only reads blob: and data: URIs, got "${uri.split(':')[0]}:"`);
	}
	return (await fetch(uri)).blob();
}
