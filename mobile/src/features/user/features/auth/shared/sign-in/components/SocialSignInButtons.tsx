import React from 'react';
import { OrDivider } from '@/features/user/features/auth/shared/sign-in/components/OrDivider';
import { GoogleRenderedButton } from '@/features/user/features/auth/shared/sign-in/components/GoogleRenderedButton';
import { ProviderSignInButton } from '@/features/user/features/auth/shared/sign-in/components/ProviderSignInButton';
import type { SocialSignIn } from '@/features/user/features/auth/shared/sign-in/types/socialSignInTypes';

type SocialSignInButtonsProps = {
	social: SocialSignIn;
	disabled: boolean;
};

export function SocialSignInButtons({ social, disabled }: SocialSignInButtonsProps) {
	return (
		<>
			<OrDivider />
			{social.googleButton ? (
				<GoogleRenderedButton slot={social.googleButton} disabled={disabled} />
			) : (
				<ProviderSignInButton provider="google" onPress={social.onGoogle} disabled={disabled} />
			)}
			<ProviderSignInButton
				provider="facebook"
				onPress={social.onFacebook}
				disabled={disabled}
				besideGoogle={social.googleButton !== undefined}
			/>
		</>
	);
}
