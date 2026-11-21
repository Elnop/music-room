import React, { useLayoutEffect } from 'react';
import { useProfileScreen } from '@/features/user/features/profile/features/profile-screen/hooks/useProfileScreen';
import { ProfileHeaderButtons } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileHeaderButtons';
import { ProfileView } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileView';

export function ProfileContainer() {
	const screen = useProfileScreen();
	const { navigation } = screen;
	const { onEditProfile, onSettings } = screen.actions;

	useLayoutEffect(() => {
		navigation.setOptions({ headerRight: profileHeaderRight(onEditProfile, onSettings) });
	}, [navigation, onEditProfile, onSettings]);

	return (
		<ProfileView
			bottomPadding={screen.bottomPadding}
			user={screen.user}
			content={screen.content}
			refresh={screen.refresh}
			actions={screen.actions}
		/>
	);
}

function profileHeaderRight(onEditProfile: () => void, onSettings: () => void) {
	return () => <ProfileHeaderButtons onEditProfile={onEditProfile} onSettings={onSettings} />;
}
