import { ApiError } from '@/shared/backend/lib/ApiError';

type ApiBody<T> = {
	success?: boolean;
	data?: T | null;
	message?: string;
	error?: {
		message?: string;
		code?: string;
		details?: unknown;
		why?: string;
		fix?: string;
	};
};

type ErrorFallback = {
	message: string;
	code: string;
};

function backendError(body: ApiBody<unknown>, status: number, fallback: ErrorFallback): ApiError {
	const error = new ApiError(
		body.error?.message || body.message || fallback.message,
		body.error?.code || fallback.code,
		body.error?.details,
		status
	);
	error.why = body.error?.why;
	error.fix = body.error?.fix;
	return error;
}

async function httpError(response: Response): Promise<ApiError> {
	const fallback = {
		message: `HTTP ${response.status}: ${response.statusText}`,
		code: `HTTP_${response.status}`,
	};
	try {
		return backendError(await response.json(), response.status, fallback);
	} catch {
		const text = await response.text().catch(() => '');
		return new ApiError(text || fallback.message, fallback.code, undefined, response.status);
	}
}

async function readBody<T>(response: Response): Promise<ApiBody<T>> {
	try {
		return await response.json();
	} catch (parseError) {
		throw new ApiError('Réponse invalide du serveur', 'PARSE_ERROR', parseError, response.status);
	}
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
	if (!response.ok) throw await httpError(response);
	const body = await readBody<T>(response);
	if (!body.success || body.error) {
		throw backendError(body, response.status, {
			message: 'API request failed',
			code: 'UNKNOWN_ERROR',
		});
	}
	if (body.data === undefined || body.data === null) {
		throw new ApiError('Réponse du serveur vide', 'NO_DATA', undefined, response.status);
	}
	return body.data;
}
