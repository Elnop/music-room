import { ApiError } from '@/services/api';

/** French text for the `ApiError` codes the user can meet on an action. */
const CODE_MESSAGES: Record<string, string> = {
	NETWORK_ERROR: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
	SESSION_EXPIRED: 'Session expirée, reconnectez-vous.',
	TRACK_DUPLICATE: 'Ce titre est déjà dans la playlist',
	PLAYLIST_ACCESS_DENIED: 'Vous ne pouvez pas modifier cette playlist',
	PLAYLIST_NOT_FOUND: "Cette playlist n'existe plus",
	DEVICE_OFFLINE: "Cet appareil n'est plus en ligne",
	QUEUE_ACCESS_DENIED: 'Vous ne pouvez pas contrôler cet appareil',
	QUEUE_ITEM_NOT_FOUND: "Ce titre n'est plus dans la file d'attente",
	DEVICE_NOT_FOUND: "Cet appareil n'existe plus",
	NOT_FRIENDS: "Seuls vos amis peuvent recevoir l'accès à vos appareils",
	PROVIDER_ALREADY_LINKED: 'Ce compte est déjà lié à un autre utilisateur',
	PROVIDER_ALREADY_SET: 'Un compte de ce service est déjà lié à votre profil',
	INVALID_PROVIDER_TOKEN: 'La connexion au service a échoué, réessayez',
	LAST_PROVIDER: 'Impossible de retirer votre dernière méthode de connexion',
};

/**
 * A readable French message for any error thrown by an API call (#318): known
 * `ApiError` codes and statuses get their own text, anything else the
 * caller's French `fallback`. Never returns the server's or fetch's raw
 * (English) message.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
	if (!(error instanceof ApiError)) return fallback;

	const byCode = CODE_MESSAGES[error.code];
	if (byCode) return byCode;
	if (error.status === 429) return 'Trop de tentatives, réessayez dans un instant.';
	if (error.status !== undefined && error.status >= 500) {
		return 'Le serveur a rencontré un problème. Réessayez plus tard.';
	}
	return fallback;
}
