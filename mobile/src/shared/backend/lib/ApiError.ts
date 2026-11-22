export class ApiError extends Error {
	code: string;
	details?: unknown;
	status?: number;
	why?: string;
	fix?: string;

	constructor(message: string, code: string, details?: unknown, status?: number) {
		super(message);
		this.name = 'ApiError';
		this.code = code;
		this.details = details;
		this.status = status;
	}
}
