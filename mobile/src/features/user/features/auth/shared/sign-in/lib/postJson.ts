import { apiRequest } from '@/shared/backend/lib/apiRequest';

export function postJson<T>(
	endpoint: string,
	body: object,
	headers?: Record<string, string>
): Promise<T> {
	return apiRequest<T>(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
}
