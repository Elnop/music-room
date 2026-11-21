import type { OAuthProvider } from '@/features/user/features/auth/authTypes';
import type { SignInMethod } from '@/features/user/features/auth/features/linked-accounts/linkedAccountsTypes';
import EnvelopeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/envelope-solid.svg';
import FacebookRoundBrand from '@hackernoon/pixel-icon-library/icons/SVG/brands/facebook-round.svg';
import GoogleBrand from '@hackernoon/pixel-icon-library/icons/SVG/brands/google.svg';

export const PROVIDER_LABELS: Record<OAuthProvider, string> = {
	google: 'Google',
	facebook: 'Facebook',
};

export const SIGN_IN_METHODS: SignInMethod[] = [
	{ type: 'password', label: 'Email et mot de passe', icon: EnvelopeSolid },
	{ type: 'google', label: 'Google', icon: GoogleBrand },
	{ type: 'facebook', label: 'Facebook', icon: FacebookRoundBrand },
];
