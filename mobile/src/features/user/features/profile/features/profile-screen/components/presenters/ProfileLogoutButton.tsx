import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import LogoutSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/logout-solid.svg';

type ProfileLogoutButtonProps = {
	wide: boolean;
	isLoading: boolean;
	onPress: () => void;
};

export function ProfileLogoutButton({ wide, isLoading, onPress }: ProfileLogoutButtonProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { styles: buttonStyles } = useThemedStyles(createButtonStyles);

	return (
		<View style={wide ? styles.discreetLogoutSection : styles.logoutSection}>
			<Pressable
				style={wide ? buttonStyles.discreetLogoutButton : buttonStyles.logoutButton}
				onPress={onPress}
				disabled={isLoading}
				accessibilityLabel="Se déconnecter"
			>
				<PixelIcon icon={LogoutSolid} size={20} color={theme.colors.error} />
				<Text style={styles.logoutText}>Se déconnecter</Text>
			</Pressable>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		logoutSection: {
			paddingHorizontal: theme.spacing.lg,
			marginTop: theme.spacing.lg,
		},
		discreetLogoutSection: {
			paddingHorizontal: theme.spacing.lg,
			marginTop: theme.spacing.xl,
		},
		logoutText: {
			...displayText(theme, 16, 'button'),
			textTransform: 'uppercase',
			color: theme.colors.error,
		},
	});
	return styles;
}

function createButtonStyles(theme: Theme) {
	const buttonStyles = StyleSheet.create({
		logoutButton: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.md,
			borderWidth: theme.borders.hairline,
			borderColor: theme.colors.error,
			backgroundColor: 'transparent',
		},
		discreetLogoutButton: {
			flexDirection: 'row',
			alignItems: 'center',
			alignSelf: 'flex-start',
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
		},
	});
	return buttonStyles;
}
