import React from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	useWindowDimensions,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Button } from '@/shared/components/ui/Button';
import { Pressable } from '@/shared/components/ui/Pressable';
import { BackendUrlField } from '@/shared/components/form/BackendUrlField';
import { CONTENT_MAX_WIDTH } from '@/shared/constants/layout';
import { LANDING_SHOWN } from '@/shared/constants/platform';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { FloatingIconMotion } from '@/features/auth/welcome/hooks/useFloatingIcons';
import { PixelWordmark } from '@/shared/components/media/PixelWordmark';
import { LANDING_INTRO } from '@/features/auth/welcome/utils/landingContent';
import { FloatingIcon } from './FloatingIcon';
import { LandingSections } from './LandingSections';
import { Text } from '@/shared/components/ui/Text';

interface WelcomeViewProps {
	icons: FloatingIconMotion[];
	buildLabel: string;
	showServer: boolean;
	onToggleServer: () => void;
	onStart: () => void;
	onLogin: () => void;
	onOpenPrivacyPolicy: () => void;
	onOpenLink: (url: string) => void;
}

export function WelcomeView({
	icons,
	buildLabel,
	showServer,
	onToggleServer,
	onStart,
	onLogin,
	onOpenPrivacyPolicy,
	onOpenLink,
}: WelcomeViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const { height } = useWindowDimensions();
	// The landing's first title peeks above the fold, so the page reads as scrollable.
	const heroHeight = LANDING_SHOWN ? height - LANDING_PEEK : undefined;

	return (
		<SafeAreaView style={styles.container}>
			{icons.map((icon, index) => (
				<FloatingIcon key={index} {...icon} />
			))}

			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
					<View style={[styles.hero, heroHeight !== undefined && { minHeight: heroHeight }]}>
						<View style={styles.header}>
							<PixelWordmark size={48} />
							{LANDING_SHOWN && <Text style={styles.intro}>{LANDING_INTRO}</Text>}
						</View>

						<View style={styles.buttonContainer}>
							<Button title="Commencer" onPress={onStart} variant="primary" fullWidth />
							<Button title="Se connecter" onPress={onLogin} variant="outline" fullWidth />
							<>
								<Pressable
									onPress={onToggleServer}
									accessibilityLabel="Serveur"
									accessibilityState={{ expanded: showServer }}
									hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
									style={styles.serverToggle}
								>
									<PixelIcon
										name="gear"
										size={20}
										color={showServer ? theme.colors.primary : theme.colors.textSecondary}
									/>
								</Pressable>
								{showServer && (
									<View style={styles.serverPanel}>
										<BackendUrlField />
									</View>
								)}
							</>
						</View>
					</View>

					{LANDING_SHOWN ? (
						<LandingSections
							buildLabel={buildLabel}
							onOpenPrivacyPolicy={onOpenPrivacyPolicy}
							onOpenLink={onOpenLink}
						/>
					) : (
						<>
							<Pressable
								onPress={onOpenPrivacyPolicy}
								accessibilityRole="link"
								accessibilityLabel="Politique de confidentialité"
								style={styles.privacyLink}
							>
								<Text style={styles.privacyLinkText}>Politique de confidentialité</Text>
							</Pressable>
							<Text style={styles.buildLabel}>{buildLabel}</Text>
						</>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const LANDING_PEEK = 96;

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		flex: {
			flex: 1,
		},
		content: {
			flexGrow: 1,
			justifyContent: 'space-between',
			padding: theme.spacing.lg,
		},
		hero: {
			flex: 1,
		},
		header: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			gap: theme.spacing.xl,
		},
		intro: {
			maxWidth: CONTENT_MAX_WIDTH.form,
			marginBottom: theme.spacing.xl,
			fontSize: theme.typography.sizes.lg,
			lineHeight: 24,
			color: theme.colors.text,
			textAlign: 'center',
		},
		// As wide as the sign-in form's fields on wide screens.
		buttonContainer: {
			width: '100%',
			maxWidth: CONTENT_MAX_WIDTH.form - 2 * theme.spacing.lg,
			alignSelf: 'center',
			gap: theme.spacing.md,
			marginBottom: theme.spacing.lg,
		},
		serverToggle: {
			alignSelf: 'center',
			padding: theme.spacing.xs,
		},
		privacyLink: {
			alignSelf: 'center',
			marginBottom: theme.spacing.sm,
		},
		privacyLinkText: {
			fontSize: 12,
			color: theme.colors.textSecondary,
			textDecorationLine: 'underline',
		},
		buildLabel: {
			fontSize: 12,
			color: theme.colors.textSecondary,
			textAlign: 'center',
		},
		serverPanel: {
			padding: theme.spacing.md,
			backgroundColor: theme.colors.surface,
			borderWidth: theme.borders.thin,
			borderColor: theme.colors.border,
		},
	});
