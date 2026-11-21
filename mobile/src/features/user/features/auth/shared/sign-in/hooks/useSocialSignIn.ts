import { useProviderSignIn } from '@/features/user/features/auth/shared/sign-in/hooks/useProviderSignIn';
import { useProviderButtons } from '@/features/user/features/auth/shared/sign-in/hooks/useProviderButtons';
import type { SocialSignIn } from '@/features/user/features/auth/shared/sign-in/types/socialSignInTypes';

export function useSocialSignIn(onFailure: (message: string) => void): SocialSignIn {
	const provider = useProviderSignIn(onFailure);
	const googleButton = useProviderButtons(() => provider.signIn('google'), 'form');
	return {
		onGoogle: () => provider.signIn('google'),
		onFacebook: () => provider.signIn('facebook'),
		googleButton,
		isPending: provider.isPending,
	};
}
