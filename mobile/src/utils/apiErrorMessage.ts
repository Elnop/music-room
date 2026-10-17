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
	PROVIDER_NOT_LINKED: "Ce compte n'est pas lié à votre profil",
	// Authentication (#341)
	INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
	EMAIL_ALREADY_EXISTS: 'Cet email est déjà utilisé',
	USERNAME_TAKEN: "Ce nom d'utilisateur est déjà pris",
	INVALID_CODE: 'Code de vérification incorrect',
	NO_CODE_FOUND: 'Aucun code en attente, demandez-en un nouveau',
	CODE_EXPIRED: 'Ce code a expiré, demandez-en un nouveau',
	INVALID_RESET_CODE: 'Code de réinitialisation incorrect ou expiré',
	RESET_CODE_EXPIRED: 'Ce code a expiré, demandez-en un nouveau',
	ALREADY_VERIFIED: 'Cet email est déjà vérifié, connectez-vous',
	EMAIL_NOT_VERIFIED: "Votre adresse email n'est pas vérifiée",
	INVALID_FACEBOOK_TOKEN: 'La connexion Facebook a échoué, réessayez',
	TOKEN_REVOKED: 'Session expirée, reconnectez-vous.',
	RATE_LIMIT_EXCEEDED: 'Trop de tentatives, réessayez dans un instant.',
	TOO_MANY_ATTEMPTS: 'Trop de tentatives, réessayez dans un instant.',
	RESEND_COOLDOWN: 'Patientez un instant avant de redemander un code.',
	RESEND_LIMIT_EXCEEDED: 'Trop de codes demandés, réessayez plus tard.',
	ACCOUNT_LOCKED: 'Compte temporairement bloqué après trop de tentatives. Réessayez plus tard.',
	IP_BLOCKED: 'Accès temporairement restreint. Réessayez plus tard.',
	AUTH_UNAVAILABLE: "Le service d'authentification est indisponible. Réessayez plus tard.",
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
