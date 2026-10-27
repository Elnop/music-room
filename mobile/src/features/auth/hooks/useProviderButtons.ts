import type { GoogleButtonSlot, GoogleButtonVariant } from '@/features/auth/types';

/** Native apps draw their own Google button, and their SDKs load at app start. */
export function useProviderButtons(
	_onGoogleCredential: () => void,
	_variant: GoogleButtonVariant
): GoogleButtonSlot | undefined {
	return undefined;
}
