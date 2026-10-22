import React from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/ui/Button';
import { Pressable } from '@/shared/components/ui/Pressable';
import { BackendUrlField } from '@/shared/components/form/BackendUrlField';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { FloatingIconMotion } from '@/features/auth/welcome/hooks/useFloatingIcons';
import logo from '@/assets/logo/logo.png';
import { FloatingIcon } from './FloatingIcon';

interface WelcomeViewProps {
	icons: FloatingIconMotion[];
	/** The backend address field is open. */
	showServer: boolean;
	onToggleServer: () => void;
	onStart: () => void;
	onLogin: () => void;
}

export function WelcomeView({
	icons,
	showServer,
	onToggleServer,
	onStart,
	onLogin,
}: WelcomeViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

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
					<View style={styles.header}>
						<Image source={logo} style={styles.logo} resizeMode="contain" />
					</View>

					<View style={styles.buttonContainer}>
						<Button title="Commencer" onPress={onStart} variant="primary" fullWidth />
						<Button title="Se connecter" onPress={onLogin} variant="outline" fullWidth />
						<Pressable
							onPress={onToggleServer}
							accessibilityLabel="Serveur"
							accessibilityState={{ expanded: showServer }}
							hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
							style={styles.serverToggle}
						>
							<Ionicons
								name="settings-outline"
								size={20}
								color={showServer ? theme.colors.primary : theme.colors.textSecondary}
							/>
						</Pressable>
						{showServer && (
							<View style={styles.serverPanel}>
								<BackendUrlField />
							</View>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

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
		header: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
		},
		logo: {
			width: 300,
			height: 300,
		},
		buttonContainer: {
			gap: theme.spacing.md,
			marginBottom: theme.spacing.xl,
		},
		serverToggle: {
			alignSelf: 'center',
			padding: theme.spacing.xs,
		},
		serverPanel: {
			padding: theme.spacing.md,
			backgroundColor: theme.colors.surface,
			borderRadius: 12,
			borderWidth: theme.borders.thin,
			borderColor: theme.colors.border,
		},
	});
