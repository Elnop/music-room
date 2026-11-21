import { logger } from '@/shared/logging/logger';
import { renderGoogleButton } from '@/features/user/features/auth/shared/sign-in/lib/googleSignIn.web';
import type { GoogleButtonVariant } from '@/features/user/features/auth/authTypes';
import type {
	GoogleButtonCallbacks,
	GoogleButtonTarget,
} from '@/features/user/features/auth/shared/sign-in/types/googleButtonTypes';

export function mountGoogleButton(
	target: GoogleButtonTarget,
	variant: GoogleButtonVariant,
	{ onCredential, onFailure }: GoogleButtonCallbacks
): () => void {
	let mounted = true;
	let release: (() => void) | undefined;
	renderGoogleButton(target, variant, onCredential).then(
		done => {
			if (mounted) release = done;
			else done();
		},
		(error: unknown) => {
			logger.warn('[OAuth] Google button not rendered:', {
				errorMessage: error instanceof Error ? error.message : String(error),
			});
			if (mounted) onFailure();
		}
	);
	return () => {
		mounted = false;
		release?.();
	};
}
