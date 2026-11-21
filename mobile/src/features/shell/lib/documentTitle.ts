const APP_NAME = 'Zumik';

export function formatDocumentTitle(options?: { title?: string }): string {
	const title = options?.title?.trim();
	return title ? `${title} · ${APP_NAME}` : APP_NAME;
}
