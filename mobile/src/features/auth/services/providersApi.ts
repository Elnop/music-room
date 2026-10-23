import { apiRequest } from '@/shared/services/api';
import type {
	LinkedProvidersResponse,
	MessageResponse,
	OAuthProvider,
} from '@/features/auth/types';

const bearer = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` });

export function getLinkedProviders(accessToken: string): Promise<LinkedProvidersResponse> {
	return apiRequest('/api/auth/providers', { method: 'GET', headers: bearer(accessToken) });
}

export function unlinkProvider(
	accessToken: string,
	provider: OAuthProvider
): Promise<MessageResponse> {
	return apiRequest(`/api/auth/providers/${provider}`, {
		method: 'DELETE',
		headers: bearer(accessToken),
	});
}

/** Links a Google (ID token) or Facebook (access token) account to the signed-in user. */
export function linkProvider(
	accessToken: string,
	provider: OAuthProvider,
	token: string
): Promise<LinkedProvidersResponse> {
	const body = provider === 'google' ? { idToken: token } : { accessToken: token };
	return apiRequest(`/api/auth/providers/${provider}/link`, {
		method: 'POST',
		headers: bearer(accessToken),
		body: JSON.stringify(body),
	});
}
