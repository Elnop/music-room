import React from 'react';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PROVIDER_LABELS } from '@/features/user/features/auth/features/linked-accounts/linkedAccountsConfig';
import type { OAuthProvider } from '@/features/user/features/auth/authTypes';

type LinkToggleButtonProps = {
	provider: OAuthProvider;
	linked: boolean;
	pending: boolean;
	disabled: boolean;
	onPress: () => void;
};

export function LinkToggleButton({
	provider,
	linked,
	pending,
	disabled,
	onPress,
}: LinkToggleButtonProps) {
	const { styles } = useThemedStyles(createStyles);
	const label = linked ? 'Délier' : 'Lier';

	return (
		<Pressable
			style={[styles.button, linked ? styles.unlink : styles.link, disabled && styles.disabled]}
			onPress={onPress}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityLabel={`${label} ${PROVIDER_LABELS[provider]}`}
			accessibilityState={{ disabled, busy: pending }}
		>
			<Text style={[styles.text, linked ? styles.unlinkText : styles.linkText]}>
				{pending ? '...' : label}
			</Text>
		</Pressable>
	);
}

function tone(borderColor: string, backgroundColor: string): ViewStyle {
	return { borderColor, backgroundColor };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		button: {
			paddingVertical: theme.spacing.xs,
			paddingHorizontal: theme.spacing.md,
			borderWidth: theme.borders.hairline,
			minWidth: theme.controls.actionButton,
			alignItems: 'center',
		},
		disabled: {
			opacity: 0.5,
			pointerEvents: 'none',
		},
		text: {
			...displayText(theme, theme.typography.sizes.md, 'button'),
			textTransform: 'uppercase',
		},
		link: tone(theme.colors.primary, theme.colors.primary),
		unlink: tone(theme.colors.error, 'transparent'),
		linkText: { color: theme.colors.textInverse },
		unlinkText: { color: theme.colors.error },
	});
	return styles;
}
