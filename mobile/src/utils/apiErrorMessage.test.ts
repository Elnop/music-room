import { ApiError } from '@/services/api';
import { apiErrorMessage } from '@/utils/apiErrorMessage';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

const FALLBACK = "Impossible d'ajouter le titre";

describe('apiErrorMessage', () => {
	it.each([
		[
			'network down',
			new ApiError('Network request failed', 'NETWORK_ERROR'),
			'Impossible de joindre le serveur. Vérifiez votre connexion.',
		],
		[
			'session expired',
			new ApiError('Session expired. Please login again.', 'SESSION_EXPIRED'),
			'Session expirée, reconnectez-vous.',
		],
		[
			'rate limited',
			new ApiError('Too many requests', 'RATE_LIMIT_EXCEEDED', undefined, 429),
			'Trop de tentatives, réessayez dans un instant.',
		],
		[
			'server error',
			new ApiError('Internal error', 'INTERNAL_ERROR', undefined, 500),
			'Le serveur a rencontré un problème. Réessayez plus tard.',
		],
		[
			'bad gateway',
			new ApiError('HTTP 502: Bad Gateway', 'HTTP_ERROR', undefined, 502),
			'Le serveur a rencontré un problème. Réessayez plus tard.',
		],
		[
			'duplicate track',
			new ApiError('Track already exists', 'TRACK_DUPLICATE', undefined, 409),
			'Ce titre est déjà dans la playlist',
		],
		[
			'playlist access denied',
			new ApiError('Denied', 'PLAYLIST_ACCESS_DENIED', undefined, 403),
			'Vous ne pouvez pas modifier cette playlist',
		],
		[
			'playlist not found',
			new ApiError('Not found', 'PLAYLIST_NOT_FOUND', undefined, 404),
			"Cette playlist n'existe plus",
		],
		[
			'device offline',
			new ApiError('Offline', 'DEVICE_OFFLINE', undefined, 409),
			"Cet appareil n'est plus en ligne",
		],
		[
			'queue access denied',
			new ApiError('Forbidden', 'QUEUE_ACCESS_DENIED', undefined, 403),
			'Vous ne pouvez pas contrôler cet appareil',
		],
		[
			'queue item gone',
			new ApiError('Queue item not found', 'QUEUE_ITEM_NOT_FOUND', undefined, 404),
			"Ce titre n'est plus dans la file d'attente",
		],
		[
			'device gone',
			new ApiError('Device not found', 'DEVICE_NOT_FOUND', undefined, 404),
			"Cet appareil n'existe plus",
		],
		[
			'license to a non-friend',
			new ApiError('Only friends', 'NOT_FRIENDS', undefined, 400),
			"Seuls vos amis peuvent recevoir l'accès à vos appareils",
		],
		[
			'provider linked elsewhere',
			new ApiError('Already linked', 'PROVIDER_ALREADY_LINKED', undefined, 409),
			'Ce compte est déjà lié à un autre utilisateur',
		],
		[
			'provider already set',
			new ApiError('Already set', 'PROVIDER_ALREADY_SET', undefined, 409),
			'Un compte de ce service est déjà lié à votre profil',
		],
		[
			'invalid provider token',
			new ApiError('Invalid token', 'INVALID_PROVIDER_TOKEN', undefined, 400),
			'La connexion au service a échoué, réessayez',
		],
		[
			'last sign-in method',
			new ApiError('Cannot unlink', 'LAST_PROVIDER', undefined, 400),
			'Impossible de retirer votre dernière méthode de connexion',
		],
		[
			'wrong password',
			new ApiError('Invalid email or password', 'INVALID_CREDENTIALS', undefined, 401),
			'Email ou mot de passe incorrect',
		],
		[
			'email taken',
			new ApiError('Email already registered', 'EMAIL_ALREADY_EXISTS', undefined, 409),
			'Cet email est déjà utilisé',
		],
		[
			'username taken',
			new ApiError('Username already taken', 'USERNAME_TAKEN', undefined, 409),
			"Ce nom d'utilisateur est déjà pris",
		],
		[
			'wrong verification code',
			new ApiError('Invalid verification code', 'INVALID_CODE', undefined, 400),
			'Code de vérification incorrect',
		],
		[
			'expired verification code',
			new ApiError('Verification code expired', 'CODE_EXPIRED', undefined, 400),
			'Ce code a expiré, demandez-en un nouveau',
		],
		[
			'wrong reset code',
			new ApiError('Invalid reset code', 'INVALID_RESET_CODE', undefined, 400),
			'Code de réinitialisation incorrect ou expiré',
		],
		[
			'locked account',
			new ApiError('Account temporarily locked', 'ACCOUNT_LOCKED', undefined, 429),
			'Compte temporairement bloqué après trop de tentatives. Réessayez plus tard.',
		],
		[
			'auth outage',
			new ApiError('Authentication service is unavailable', 'AUTH_UNAVAILABLE', undefined, 503),
			"Le service d'authentification est indisponible. Réessayez plus tard.",
		],
	])('maps %s to French', (_label, error, expected) => {
		expect(apiErrorMessage(error, FALLBACK)).toBe(expected);
	});

	it.each([
		['an unknown ApiError', new ApiError('Something odd', 'VALIDATION_ERROR', undefined, 400)],
		[
			'an expired token on any endpoint',
			new ApiError('Invalid token', 'INVALID_TOKEN', undefined, 401),
		],
		['an ApiError without status', new ApiError('Invalid JSON response', 'PARSE_ERROR')],
		['a plain Error', new Error('Network request failed')],
		['a string', 'boom'],
		['undefined', undefined],
	])('returns the fallback for %s', (_label, error) => {
		expect(apiErrorMessage(error, FALLBACK)).toBe(FALLBACK);
	});
});
