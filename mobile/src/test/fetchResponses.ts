function jsonResponse(status: number, body: object): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: '',
		json: () => Promise.resolve(body),
		text: () => Promise.resolve(JSON.stringify(body)),
	} as unknown as Response;
}

export const ok = (data: object) => jsonResponse(200, { success: true, data });

export const fail = (status: number, code: string, message = code, details?: object) =>
	jsonResponse(status, { success: false, error: { code, message, details } });
