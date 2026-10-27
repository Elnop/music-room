import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ProfileHeader } from '@/features/profile/profileScreen/components/presenters/ProfileHeader';
import { ProfileInfoSection } from '@/features/profile/profileScreen/components/presenters/ProfileInfoSection';
import { ProfileMenuItems } from '@/features/profile/profileScreen/components/presenters/ProfileMenuItems';
import { ProfilePreferencesSection } from '@/features/profile/profileScreen/components/presenters/ProfilePreferencesSection';
import { ProfileWideHeader } from '@/features/profile/profileScreen/components/presenters/ProfileWideHeader';
import type { UserStats } from '@/features/profile/types';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import type { Theme } from '@/shared/theme/types';
import type { MusicGenre, UserProfile } from '@/types/user.types';
import { Text } from '@/shared/components/ui/Text';

interface ProfileViewProps {
	theme: Theme;
	bottomPadding: number;
	user: UserProfile | null;
	stats?: UserStats | null;
	genres: MusicGenre[];
	isRefreshing: boolean;
	isLoading: boolean;
	buildLabel: string;
	onRefresh: () => void;
	onEditProfile: () => void;
	onSettings: () => void;
	onMusicPreferences: () => void;
	onPrivacySettings: () => void;
	onLinkedAccounts: () => void;
	onMyDevices: () => void;
	onConfirmLogout: () => void;
}

export function ProfileView({
	theme,
	bottomPadding,
	user,
	stats,
	genres,
	isRefreshing,
	isLoading,
	buildLabel,
	onRefresh,
	onEditProfile,
	onSettings,
	onMusicPreferences,
	onPrivacySettings,
	onLinkedAccounts,
	onMyDevices,
	onConfirmLogout,
}: ProfileViewProps) {
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const { isWide } = useBreakpoint();

	if (!user) {
		return (
			<View style={styles.screenWrapper}>
				<Text style={styles.errorText}>Aucune donnée utilisateur</Text>
			</View>
		);
	}

	const preferences = <ProfilePreferencesSection genres={genres} onModify={onMusicPreferences} />;
	const info = <ProfileInfoSection user={user} />;
	const menu = (
		<ProfileMenuItems
			wide={isWide}
			isLoading={isLoading}
			onPrivacySettings={onPrivacySettings}
			onLinkedAccounts={onLinkedAccounts}
			onMyDevices={onMyDevices}
			onConfirmLogout={onConfirmLogout}
		/>
	);

	return (
		<View style={styles.screenWrapper}>
			<ScrollView
				style={styles.profileScroll}
				contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomPadding }]}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={onRefresh}
						tintColor={theme.colors.primary}
					/>
				}
			>
				{isWide ? (
					<>
						<ProfileWideHeader
							user={user}
							stats={stats}
							onEditProfile={onEditProfile}
							onSettings={onSettings}
						/>
						<View style={styles.columns}>
							<View style={styles.cardsColumn}>
								{preferences}
								{info}
							</View>
							<View style={styles.column}>{menu}</View>
						</View>
					</>
				) : (
					<>
						<ProfileHeader user={user} stats={stats} />
						{preferences}
						{info}
						{menu}
					</>
				)}

				<Text style={styles.buildLabel}>{buildLabel}</Text>
			</ScrollView>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		screenWrapper: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		profileScroll: {
			flex: 1,
		},
		contentContainer: {
			paddingBottom: theme.spacing.xl,
		},
		columns: {
			flexDirection: 'row',
			alignItems: 'flex-start',
		},
		column: { flex: 1, minWidth: 0 },
		// The menu items open with their own top margin: the cards beside them start level with them.
		cardsColumn: { flex: 1, minWidth: 0, paddingTop: theme.spacing.md },
		buildLabel: {
			fontSize: 12,
			color: theme.colors.textSecondary,
			textAlign: 'center',
			marginTop: theme.spacing.lg,
		},
		errorText: {
			fontSize: 16,
			color: theme.colors.error,
			textAlign: 'center',
			marginTop: theme.spacing.xl,
		},
	});
