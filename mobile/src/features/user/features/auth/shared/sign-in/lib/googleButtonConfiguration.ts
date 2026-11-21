import { GOOGLE_FORM_BUTTON } from '@/features/user/features/auth/shared/sign-in/configs/googleButtonConfig';
import type { GoogleButtonVariant } from '@/features/user/features/auth/authTypes';
import type {
	GoogleButtonConfiguration,
	GoogleButtonTarget,
} from '@/features/user/features/auth/shared/sign-in/types/googleButtonTypes';

function formWidth(target: GoogleButtonTarget): number {
	const { minWidth, maxWidth } = GOOGLE_FORM_BUTTON;
	return Math.min(maxWidth, Math.max(minWidth, Math.round(target.offsetWidth)));
}

export function googleButtonConfiguration(
	target: GoogleButtonTarget,
	variant: GoogleButtonVariant,
	onClick: () => void
): GoogleButtonConfiguration {
	const form = variant === 'form';
	return {
		type: 'standard',
		theme: form ? 'filled_black' : 'outline',
		size: form ? 'large' : 'medium',
		text: 'continue_with',
		shape: 'rectangular',
		logo_alignment: form ? 'center' : 'left',
		locale: 'fr',
		...(form ? { width: formWidth(target) } : {}),
		click_listener: onClick,
	};
}
