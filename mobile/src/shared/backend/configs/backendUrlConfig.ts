import { API_CONFIG } from '@/shared/backend/configs/apiConfig';
import { normalizeBackendUrl } from '@/shared/backend/lib/normalizeBackendUrl';

export const DEFAULT_BACKEND_URL =
	normalizeBackendUrl(API_CONFIG.BASE_URL) ?? 'http://localhost:3000';

export const INVALID_BACKEND_URL_MESSAGE =
	'Saisissez une adresse http:// ou https:// complète, par exemple http://192.168.1.20:3000';
