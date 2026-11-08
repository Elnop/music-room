import type { GoogleButtonSlot, GoogleButtonVariant } from '@/features/auth/types';

export function useProviderButtons(
	_onGoogleCredential: () => void,
	_variant: GoogleButtonVariant
): GoogleButtonSlot | undefined {
	return undefined;
}
