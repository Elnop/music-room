import { useCallback, useEffect, useRef, useState } from 'react';
import type { View } from 'react-native';
import { logger } from '@/shared/utils/logger';
import {
	renderGoogleButton,
	type GoogleButtonTarget,
} from '@/features/auth/services/googleSignIn.web';
import { preloadFacebookSdk } from '@/features/auth/services/facebookSignIn.web';
import type { GoogleButtonSlot, GoogleButtonVariant } from '@/features/auth/types';

/** Loads both SDKs with the screen; without Google's button, the screen falls back to its own. */
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
			let mounted = true;
			let release: (() => void) | undefined;
			// react-native-web hands the DOM node to a View's ref.
			const target = node as unknown as GoogleButtonTarget;
			renderGoogleButton(target, variant, () => onCredential.current()).then(
				done => {
					if (mounted) release = done;
					else done();
				},
				(error: unknown) => {
					logger.warn('[OAuth] Google button not rendered:', {
						errorMessage: error instanceof Error ? error.message : String(error),
					});
					if (mounted) setGoogleFailed(true);
				}
			);
			return () => {
				mounted = false;
				release?.();
			};
		},
		[variant]
	);

	return googleFailed ? undefined : slot;
}
