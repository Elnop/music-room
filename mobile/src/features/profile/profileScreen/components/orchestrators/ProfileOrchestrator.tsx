import React, { useLayoutEffect } from 'react';
import { useProfileScreen } from '@/features/profile/profileScreen/hooks/useProfileScreen';
import { ProfileHeaderButtons } from '@/features/profile/profileScreen/components/presenters/ProfileHeaderButtons';
import { ProfileView } from '@/features/profile/profileScreen/components/presenters/ProfileView';

export function ProfileOrchestrator() {
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
			onMusicPreferences={handleMusicPreferences}
			onPrivacySettings={handlePrivacySettings}
			onLinkedAccounts={handleLinkedAccounts}
			onMyDevices={handleMyDevices}
			onConfirmLogout={confirmLogout}
		/>
	);
}
