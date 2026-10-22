import React from 'react';
import {
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import logo from '@/assets/logo/logo.png';

interface AuthFormLayoutProps {
	/** Side of the square logo above the form. */
	logoSize: number;
	/** Extra room under the content (safe area). */
	bottomInset?: number;
	footerText: string;
	footerLink: string;
	onFooterLink: () => void;
	children: React.ReactNode;
}

/** The login and register layout: logo, the form, then a link to the other screen. */
export function AuthFormLayout({
	logoSize,
	bottomInset,
	footerText,
	footerLink,
	onFooterLink,
	children,
}: AuthFormLayoutProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			<KeyboardAvoidingView
				style={styles.keyboardAvoid}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<ScrollView
					contentContainerStyle={[
						styles.scrollContent,
						bottomInset !== undefined && { paddingBottom: bottomInset },
					]}
					keyboardShouldPersistTaps="handled"
					bounces={false}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.content}>
						<View style={styles.header}>
							<Image
								source={logo}
								style={{ width: logoSize, height: logoSize }}
								resizeMode="contain"
							/>
						</View>

						<View style={styles.form}>{children}</View>

						<View style={styles.footer}>
							<Text style={styles.footerText}>{footerText}</Text>
							<Text style={styles.footerLink} onPress={onFooterLink}>
								{footerLink}
							</Text>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		keyboardAvoid: {
			flex: 1,
		},
		scrollContent: {
			flexGrow: 1,
		},
		content: {
			flex: 1,
			padding: theme.spacing.lg,
			justifyContent: 'center',
		},
		header: {
			alignItems: 'center',
			marginBottom: theme.spacing.xl,
		},
		form: {
			gap: theme.spacing.md,
		},
		footer: {
			flexDirection: 'row',
			justifyContent: 'center',
			marginTop: theme.spacing.xl,
		},
		footerText: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		footerLink: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.primary,
			fontWeight: theme.typography.weights.semibold,
		},
	});
