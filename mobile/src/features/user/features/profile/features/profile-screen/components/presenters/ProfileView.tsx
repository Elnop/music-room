import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ProfileHeader } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileHeader';
import { ProfileInfoSection } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileInfoSection';
import { ProfileMenuItems } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileMenuItems';
import { ProfilePreferencesSection } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfilePreferencesSection';
import { ProfileWideHeader } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileWideHeader';
import type { UserStats } from '@/features/user/features/profile/types';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import type { Theme } from '@/shared/theme/lib/types';
import type { MusicGenre, UserProfile } from '@/shared/users/user.types';
import { Text } from '@/shared/theme/components/Text';

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
	const column = useContentColumn();

	if (!user) {
		return (
			<View style={styles.screenWrapper}>
				<Text style={styles.errorText}>Aucune donnée utilisateur</Text>
			</View>
		);
	}

	const preferences = (
		<ProfilePreferencesSection genres={genres} onModify={onMusicPreferences} prominent={isWide} />
	);
	const info = <ProfileInfoSection user={user} prominent={isWide} />;
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
					<View style={column}>
						<ProfileWideHeader
							user={user}
							stats={stats}
							onEditProfile={onEditProfile}
							onSettings={onSettings}
						/>
						<View style={styles.wideSection}>{preferences}</View>
						<View style={styles.wideSection}>{info}</View>
						<Text style={styles.wideHeading}>Compte</Text>
						{menu}
						<Text style={styles.buildLabel}>{buildLabel}</Text>
					</View>
				) : (
					<>
						<ProfileHeader user={user} stats={stats} />
						{preferences}
						{info}
						{menu}
						<Text style={styles.buildLabel}>{buildLabel}</Text>
					</>
				)}
			</ScrollView>
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
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
		wideSection: { marginTop: theme.spacing.md },
		wideHeading: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
			marginHorizontal: theme.spacing.lg,
			marginTop: theme.spacing.lg,
		},
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
}
