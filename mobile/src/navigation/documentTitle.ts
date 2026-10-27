const APP_NAME = 'Zumik';

/** The browser tab's title: « Playlists · Zumik », the app name alone for a screen without a title. */
export function formatDocumentTitle(options?: { title?: string }): string {
	const title = options?.title?.trim();
	return title ? `${title} · ${APP_NAME}` : APP_NAME;
}
