import type {
	GoogleButtonSlot,
	GoogleButtonVariant,
} from '@/features/user/features/auth/authTypes';

export function useProviderButtons(
	_onGoogleCredential: () => void,
	_variant: GoogleButtonVariant,
): GoogleButtonSlot | undefined {
	return undefined;
}
