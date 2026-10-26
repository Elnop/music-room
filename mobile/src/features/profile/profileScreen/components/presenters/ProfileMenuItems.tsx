import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileNavigationItem } from '@/features/profile/profileScreen/components/presenters/ProfileNavigationItem';
import { Pressable } from '@/shared/components/ui/Pressable';
import { SOCIAL_SIGN_IN_AVAILABLE } from '@/shared/constants/platform';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';

interface ProfileMenuItemsProps {
	isLoading: boolean;
	onPrivacySettings: () => void;
	onLinkedAccounts: () => void;
	onMyDevices: () => void;
	onConfirmLogout: () => void;
}

export function ProfileMenuItems({
	isLoading,
	onPrivacySettings,
	onLinkedAccounts,
	onMyDevices,
	onConfirmLogout,
}: ProfileMenuItemsProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<>
			<ProfileNavigationItem
				title="Confidentialité"
				subtitle="Gérez qui peut voir vos informations"
				icon="lock-closed"
				onPress={onPrivacySettings}
			/>

			{SOCIAL_SIGN_IN_AVAILABLE && (
				<ProfileNavigationItem
					title="Comptes liés"
					subtitle="Ajoutez ou retirez la connexion Google et Facebook"
					icon="link"
					onPress={onLinkedAccounts}
				/>
			)}

			<ProfileNavigationItem
				title="Mes appareils"
				subtitle="Choisissez quels amis contrôlent chaque appareil"
				icon="phone-portrait-outline"
				onPress={onMyDevices}
			/>

			<View style={styles.logoutSection}>
				<Pressable
					style={styles.logoutButton}
					onPress={onConfirmLogout}
					disabled={isLoading}
					accessibilityLabel="Se déconnecter"
				>
					<Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
					<Text style={styles.logoutText}>Se déconnecter</Text>
				</Pressable>
			</View>

			<Text style={styles.footer}>Zumik v1.0.0</Text>
		</>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		logoutSection: {
			paddingHorizontal: theme.spacing.lg,
			marginTop: theme.spacing.lg,
		},
		logoutButton: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.md,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: theme.colors.error,
			backgroundColor: 'transparent',
		},
		logoutText: {
			fontSize: 16,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.error,
		},
		footer: {
			textAlign: 'center',
			fontSize: 12,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xl,
		},
	});
