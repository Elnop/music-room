import { apiRequest } from '@/shared/backend/lib/apiRequest';
import type {
	LinkedProvidersResponse,
	MessageResponse,
	OAuthProvider,
} from '@/features/user/features/auth/authTypes';

function bearer(accessToken: string) {
	return { Authorization: `Bearer ${accessToken}` };
}

export function getLinkedProviders(accessToken: string): Promise<LinkedProvidersResponse> {
	return apiRequest('/api/auth/providers', { method: 'GET', headers: bearer(accessToken) });
}

export function unlinkProvider(
	accessToken: string,
	provider: OAuthProvider,
): Promise<MessageResponse> {
	return apiRequest(`/api/auth/providers/${provider}`, {
		method: 'DELETE',
		headers: bearer(accessToken),
	});
}

export function linkProvider(
	accessToken: string,
	provider: OAuthProvider,
	token: string,
): Promise<LinkedProvidersResponse> {
	const body = provider === 'google' ? { idToken: token } : { accessToken: token };
	return apiRequest(`/api/auth/providers/${provider}/link`, {
		method: 'POST',
		headers: bearer(accessToken),
		body: JSON.stringify(body),
	});
}
