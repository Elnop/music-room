import { ApiError } from '@/shared/backend/lib/ApiError';
import { sendApiRequest } from '@/shared/backend/lib/apiClient';
import { getAuthSession, getSession } from '@/shared/backend/lib/authSession';
import { parseApiResponse } from '@/shared/backend/lib/parseApiResponse';
import type { AuthSession } from '@/shared/backend/types/sessionTypes';

const REFRESH_ENDPOINT = '/api/auth/refresh';

function sessionToken(): string | undefined {
	return getSession().accessToken || undefined;
}

async function sendAuthorized(
	endpoint: string,
	options: RequestInit,
	session: AuthSession
): Promise<Response> {
	const token = sessionToken();
	if (token && session.isTokenExpiringSoon()) {
		await session.refreshAccessToken();
		return sendApiRequest(endpoint, options, sessionToken());
	}
	const response = await sendApiRequest(endpoint, options, token);
	if (response.status !== 401 || !token) return response;
	if (!(await session.refreshAccessToken())) {
		throw new ApiError('Session expirée, reconnectez-vous.', 'SESSION_EXPIRED', undefined, 401);
	}
	return sendApiRequest(endpoint, options, sessionToken());
}

function toApiError(error: unknown): ApiError {
	if (error instanceof ApiError) return error;
	const wrapped =
		error instanceof Error
			? new ApiError(error.message, 'NETWORK_ERROR')
			: new ApiError('Erreur inconnue', 'UNKNOWN_ERROR');
	wrapped.cause = error;
	return wrapped;
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const session = endpoint === REFRESH_ENDPOINT ? null : getAuthSession();
	try {
		const response = session
			? await sendAuthorized(endpoint, options, session)
			: await sendApiRequest(endpoint, options);
		return await parseApiResponse<T>(response);
	} catch (error) {
		throw toApiError(error);
	}
}
