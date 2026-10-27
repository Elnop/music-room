import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileNavigationItem } from '@/features/profile/profileScreen/components/presenters/ProfileNavigationItem';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Text } from '@/shared/components/ui/Text';

interface ProfileMenuItemsProps {
	/** Wide screens: a logout without the full-width outline. */
	wide?: boolean;
	isLoading: boolean;
	onPrivacySettings: () => void;
	onLinkedAccounts: () => void;
	onMyDevices: () => void;
	onConfirmLogout: () => void;
}

export function ProfileMenuItems({
	wide = false,
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

			<ProfileNavigationItem
				title="Comptes liés"
				subtitle="Ajoutez ou retirez la connexion Google et Facebook"
				icon="link"
				onPress={onLinkedAccounts}
			/>

			<ProfileNavigationItem
				title="Mes appareils"
				subtitle="Choisissez quels amis contrôlent chaque appareil"
				icon="phone-portrait-outline"
				onPress={onMyDevices}
			/>

			<View style={wide ? styles.discreetLogoutSection : styles.logoutSection}>
				<Pressable
					style={wide ? styles.discreetLogoutButton : styles.logoutButton}
					onPress={onConfirmLogout}
					disabled={isLoading}
					accessibilityLabel="Se déconnecter"
				>
					<Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
					<Text style={styles.logoutText}>Se déconnecter</Text>
				</Pressable>
			</View>

		</>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		logoutSection: {
			paddingHorizontal: theme.spacing.lg,
			marginTop: theme.spacing.lg,
		},
		discreetLogoutSection: {
			paddingHorizontal: theme.spacing.lg,
			marginTop: theme.spacing.xl,
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
		discreetLogoutButton: {
			flexDirection: 'row',
			alignItems: 'center',
			alignSelf: 'flex-start',
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
			borderRadius: 12,
		},
		logoutText: {
			fontSize: 16,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.error,
		},
	});
