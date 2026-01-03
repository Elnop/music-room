// API Response Types
export interface ApiResponse<T> {
	data?: T;
	error?: string;
	message?: string;
}

export interface ApiError {
	message: string;
	code?: string;
	details?: unknown;
}
