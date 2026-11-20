import React, { useLayoutEffect } from 'react';
import { useProfileScreen } from '@/features/user/features/profile/features/profile-screen/useProfileScreen';
import { ProfileHeaderButtons } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileHeaderButtons';
import { ProfileView } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileView';

export function ProfileContainer() {
	const {
		theme,
		bottomPadding,
		user,
		navigation,
		stats,
		genres,
		isRefreshing,
		isLoading,
		buildLabel,
		handleRefresh,
		handleEditProfile,
		handleSettings,
		handleMusicPreferences,
		handlePrivacySettings,
		handleLinkedAccounts,
		handleMyDevices,
		confirmLogout,
	} = useProfileScreen();

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<ProfileHeaderButtons onEditProfile={handleEditProfile} onSettings={handleSettings} />
			),
		});
	}, [navigation, handleEditProfile, handleSettings]);

	return (
		<ProfileView
			theme={theme}
			bottomPadding={bottomPadding}
			user={user}
			stats={stats}
			genres={genres}
			isRefreshing={isRefreshing}
			isLoading={isLoading}
			buildLabel={buildLabel}
			onRefresh={handleRefresh}
			onEditProfile={handleEditProfile}
			onSettings={handleSettings}
			onMusicPreferences={handleMusicPreferences}
			onPrivacySettings={handlePrivacySettings}
			onLinkedAccounts={handleLinkedAccounts}
			onMyDevices={handleMyDevices}
			onConfirmLogout={confirmLogout}
		/>
	);
}
