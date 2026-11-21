import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { GOOGLE_FORM_BUTTON } from '@/features/user/features/auth/shared/sign-in/configs/googleButtonConfig';
import {
	providerButtonFrame,
	providerLabel,
	providerMark,
} from '@/features/user/features/auth/shared/sign-in/lib/providerButtonStyle';
import type { OAuthProvider } from '@/features/user/features/auth/authTypes';

const LABELS: Record<OAuthProvider, string> = {
	google: 'Continuer avec Google',
	facebook: 'Continuer avec Facebook',
};

const MARKS: Record<OAuthProvider, string> = { google: 'G', facebook: 'f' };

type ProviderSignInButtonProps = {
	provider: OAuthProvider;
	onPress: () => void;
	disabled: boolean;
	besideGoogle?: boolean;
};

export function ProviderSignInButton({
	provider,
	onPress,
	disabled,
	besideGoogle = false,
}: ProviderSignInButtonProps) {
	const { styles } = useThemedStyles(createStyles);
	const google = provider === 'google';

	return (
		<Pressable
			style={[
				google ? styles.googleButton : styles.facebookButton,
				besideGoogle && styles.besideGoogle,
			]}
			onPress={onPress}
			disabled={disabled}
			accessibilityLabel={LABELS[provider]}
		>
			<Text style={google ? styles.googleMark : styles.facebookMark}>{MARKS[provider]}</Text>
			<Text style={google ? styles.googleLabel : styles.facebookLabel}>{LABELS[provider]}</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const { colors } = theme;
	const styles = StyleSheet.create({
		googleButton: providerButtonFrame(theme, colors.googleSurface, colors.googleBorder),
		googleMark: providerMark(theme, colors.googleMark),
		googleLabel: providerLabel(theme, colors.googleText),
		facebookButton: providerButtonFrame(theme, colors.facebook, colors.facebook),
		facebookMark: providerMark(theme, colors.onFacebook),
		facebookLabel: providerLabel(theme, colors.onFacebook),
		besideGoogle: {
			width: '100%',
			maxWidth: GOOGLE_FORM_BUTTON.maxWidth,
			height: GOOGLE_FORM_BUTTON.height,
			alignSelf: 'center',
			paddingVertical: 0,
			borderRadius: GOOGLE_FORM_BUTTON.radius,
		},
	});
	return styles;
}
