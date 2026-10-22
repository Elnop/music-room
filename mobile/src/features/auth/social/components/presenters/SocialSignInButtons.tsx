import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';

interface SocialSignInButtonsProps {
	onGoogle: () => void;
	onFacebook: () => void;
	disabled: boolean;
}

/** « OU », then the Google and Facebook buttons in their brand colours. */
export function SocialSignInButtons({ onGoogle, onFacebook, disabled }: SocialSignInButtonsProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<>
			<View style={styles.divider}>
				<View style={styles.dividerLine} />
				<Text style={styles.dividerText}>OU</Text>
				<View style={styles.dividerLine} />
			</View>

			<Pressable
				style={styles.googleButton}
				onPress={onGoogle}
				disabled={disabled}
				accessibilityLabel="Continuer avec Google"
			>
				<Text style={styles.googleIcon}>G</Text>
				<Text style={styles.googleButtonText}>Continuer avec Google</Text>
			</Pressable>

			<Pressable
				style={styles.facebookButton}
				onPress={onFacebook}
				disabled={disabled}
				accessibilityLabel="Continuer avec Facebook"
			>
				<Text style={styles.facebookIcon}>f</Text>
				<Text style={styles.facebookButtonText}>Continuer avec Facebook</Text>
			</Pressable>
		</>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		divider: {
			flexDirection: 'row',
			alignItems: 'center',
			marginVertical: theme.spacing.lg,
		},
		dividerLine: {
			flex: 1,
			height: 1,
			backgroundColor: theme.colors.divider,
		},
		dividerText: {
			marginHorizontal: theme.spacing.md,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		googleButton: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: theme.colors.googleSurface,
			borderRadius: 8,
			paddingVertical: 12,
			borderWidth: 1,
			borderColor: theme.colors.googleBorder,
		},
		googleIcon: {
			fontSize: 20,
			fontWeight: 'bold',
			color: theme.colors.googleMark,
			marginRight: 12,
		},
		googleButtonText: {
			fontSize: 16,
			fontWeight: '500',
			color: theme.colors.googleText,
		},
		facebookButton: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: theme.colors.facebook,
			borderRadius: 8,
			paddingVertical: 12,
			borderWidth: 1,
			borderColor: theme.colors.facebook,
		},
		facebookIcon: {
			fontSize: 20,
			fontWeight: 'bold',
			color: theme.colors.onFacebook,
			marginRight: 12,
		},
		facebookButtonText: {
			fontSize: 16,
			fontWeight: '500',
			color: theme.colors.onFacebook,
		},
	});
