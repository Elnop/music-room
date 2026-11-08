const APP_NAME = 'Zumik';

/** « Playlists · Zumik », or the app name alone. */
export function formatDocumentTitle(options?: { title?: string }): string {
	const title = options?.title?.trim();
	return title ? `${title} · ${APP_NAME}` : APP_NAME;
}
