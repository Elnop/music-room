import { ApiError } from '@/shared/services/api';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import type { OAuthProvider } from '@/features/auth/types';
import { isScriptLoadError } from '@/features/auth/utils/loadScript';

const NETWORK_MESSAGE = 'Impossible de joindre le serveur. Vérifiez votre connexion.';

/** Native errors with their own French text, per provider. */
const NATIVE_MESSAGES: Record<OAuthProvider, (message: string) => string | null> = {
	google: message => {
		if (message === 'Google Play Services not available') {
			return 'Google Play Services est indisponible. Mettez-le à jour puis réessayez.';
		}
		if (message === 'Sign-in already in progress') {
			return 'Une connexion est déjà en cours, patientez.';
		}
		return message.includes('not configured')
			? "La connexion avec Google n'est pas configurée."
			: null;
	},
	facebook: message =>
		message.includes('not configured') ? "La connexion avec Facebook n'est pas configurée." : null,
};

const PROVIDER_NAMES: Record<OAuthProvider, string> = { google: 'Google', facebook: 'Facebook' };

const FALLBACKS: Record<OAuthProvider, string> = {
	google: 'La connexion avec Google a échoué. Réessayez.',
	facebook: 'La connexion avec Facebook a échoué. Réessayez.',
};

export function oauthErrorMessage(provider: OAuthProvider, error: unknown): string {
	const fallback = FALLBACKS[provider];
	if (error instanceof ApiError) return apiErrorMessage(error, fallback);
	if (!(error instanceof Error)) return fallback;
	if (isScriptLoadError(error)) {
		return `Le service de connexion ${PROVIDER_NAMES[provider]} n'a pas pu être chargé. Vérifiez votre connexion ou votre bloqueur de contenu.`;
	}
	const native = NATIVE_MESSAGES[provider](error.message);
	if (native) return native;
	if (error.message.includes('network') || error.message.includes('timeout')) {
		return NETWORK_MESSAGE;
	}
	return fallback;
}
