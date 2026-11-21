import { useCallback, useEffect, useRef, useState } from 'react';
import type { View } from 'react-native';
import { mountGoogleButton } from '@/features/user/features/auth/shared/sign-in/lib/mountGoogleButton';
import { preloadFacebookSdk } from '@/features/user/features/auth/shared/sign-in/lib/facebookSignIn.web';
import type { GoogleButtonTarget } from '@/features/user/features/auth/shared/sign-in/types/googleButtonTypes';
import type {
	GoogleButtonSlot,
	GoogleButtonVariant,
} from '@/features/user/features/auth/authTypes';

export function useProviderButtons(
	onGoogleCredential: () => void,
	variant: GoogleButtonVariant
): GoogleButtonSlot | undefined {
	const [googleFailed, setGoogleFailed] = useState(false);
	const onCredential = useRef(onGoogleCredential);
	useEffect(() => {
		onCredential.current = onGoogleCredential;
	});

	useEffect(() => preloadFacebookSdk(), []);

	const slot = useCallback(
		(node: View | null) => {
			if (!node) return;
			return mountGoogleButton(node as unknown as GoogleButtonTarget, variant, {
				onCredential: () => onCredential.current(),
				onFailure: () => setGoogleFailed(true),
			});
		},
		[variant]
	);

	return googleFailed ? undefined : slot;
}
