import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { ProfileNavigationItem } from './ProfileNavigationItem';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import { Text } from '@/shared/theme/components/Text';
import LinkSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/link-solid.svg';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';
import LogoutSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/logout-solid.svg';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';

interface ProfileMenuItemsProps {
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
				icon={LockSolid}
				onPress={onPrivacySettings}
			/>

			<ProfileNavigationItem
				title="Comptes liés"
				subtitle="Ajoutez ou retirez la connexion Google et Facebook"
				icon={LinkSolid}
				onPress={onLinkedAccounts}
			/>

			<ProfileNavigationItem
				title="Mes appareils"
				subtitle="Choisissez quels amis contrôlent chaque appareil"
				icon={PhoneRingingLowSolid}
				onPress={onMyDevices}
			/>

			<View style={wide ? styles.discreetLogoutSection : styles.logoutSection}>
				<Pressable
					style={wide ? styles.discreetLogoutButton : styles.logoutButton}
					onPress={onConfirmLogout}
					disabled={isLoading}
					accessibilityLabel="Se déconnecter"
				>
					<PixelIcon icon={LogoutSolid} size={20} color={theme.colors.error} />
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
		},
		logoutText: {
			...displayText(theme, 16, 'button'),
			textTransform: 'uppercase',
			color: theme.colors.error,
		},
	});
