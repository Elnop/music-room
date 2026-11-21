import React from 'react';
import { ProfileLogoutButton } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileLogoutButton';
import { ProfileNavigationItem } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileNavigationItem';
import { PROFILE_MENU_ENTRIES } from '@/features/user/features/profile/features/profile-screen/profileMenuConfig';
import type { ProfileActions } from '@/features/user/features/profile/features/profile-screen/profileScreenTypes';

type ProfileMenuItemsProps = {
	wide?: boolean;
	actions: ProfileActions;
};

export function ProfileMenuItems({ wide = false, actions }: ProfileMenuItemsProps) {
	return (
		<>
			{PROFILE_MENU_ENTRIES.map(entry => (
				<ProfileNavigationItem
					key={entry.action}
					title={entry.title}
					subtitle={entry.subtitle}
					icon={entry.icon}
					onPress={actions[entry.action]}
				/>
			))}

			<ProfileLogoutButton
				wide={wide}
				isLoading={actions.isLoggingOut}
				onPress={actions.onConfirmLogout}
			/>
		</>
	);
}
