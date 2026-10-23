import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProfileHeader } from '@/features/profile/profileScreen/components/presenters/ProfileHeader';
import { ProfileInfoSection } from '@/features/profile/profileScreen/components/presenters/ProfileInfoSection';
import { ProfileMenuItems } from '@/features/profile/profileScreen/components/presenters/ProfileMenuItems';
import { ProfilePreferencesSection } from '@/features/profile/profileScreen/components/presenters/ProfilePreferencesSection';
import type { UserStats } from '@/features/profile/types';
import type { Theme } from '@/shared/theme/types';
import type { MusicGenre, UserProfile } from '@/types/user.types';

interface ProfileViewProps {
	theme: Theme;
	playerHeight: number;
	user: UserProfile | null;
	stats?: UserStats | null;
	genres: MusicGenre[];
	isRefreshing: boolean;
	isLoading: boolean;
	buildLabel: string;
	onRefresh: () => void;
	onMusicPreferences: () => void;
	onPrivacySettings: () => void;
	onLinkedAccounts: () => void;
	onMyDevices: () => void;
	onConfirmLogout: () => void;
}

export function ProfileView({
	theme,
	playerHeight,
	user,
	stats,
	genres,
	isRefreshing,
	isLoading,
	buildLabel,
	onRefresh,
	onMusicPreferences,
	onPrivacySettings,
	onLinkedAccounts,
	onMyDevices,
	onConfirmLogout,
}: ProfileViewProps) {
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	if (!user) {
		return (
			<View style={styles.screenWrapper}>
				<Text style={styles.errorText}>Aucune donnée utilisateur</Text>
			</View>
		);
	}

	return (
		<View style={styles.screenWrapper}>
			<ScrollView
				style={styles.profileScroll}
				contentContainerStyle={[
					styles.contentContainer,
					{ paddingBottom: playerHeight + theme.spacing.xl },
				]}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={onRefresh}
						tintColor={theme.colors.primary}
					/>
				}
			>
				<ProfileHeader user={user} stats={stats} />

				<ProfilePreferencesSection genres={genres} onModify={onMusicPreferences} />

				<ProfileInfoSection user={user} />

				<ProfileMenuItems
					isLoading={isLoading}
					onPrivacySettings={onPrivacySettings}
					onLinkedAccounts={onLinkedAccounts}
					onMyDevices={onMyDevices}
					onConfirmLogout={onConfirmLogout}
				/>

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
