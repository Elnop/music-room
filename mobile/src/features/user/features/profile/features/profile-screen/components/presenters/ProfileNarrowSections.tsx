import React from 'react';
import { ProfileBuildLabel } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileBuildLabel';
import { ProfileHeader } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileHeader';
import { ProfileInfoSection } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileInfoSection';
import { ProfileMenuItems } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileMenuItems';
import { ProfilePreferencesSection } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfilePreferencesSection';
import type {
	ProfileActions,
	ProfileContent,
} from '@/features/user/features/profile/features/profile-screen/profileScreenTypes';
import type { UserProfile } from '@/shared/users/userTypes';

type ProfileNarrowSectionsProps = {
	user: UserProfile;
	content: ProfileContent;
	actions: ProfileActions;
};

export function ProfileNarrowSections({ user, content, actions }: ProfileNarrowSectionsProps) {
	return (
		<>
			<ProfileHeader user={user} stats={content.stats} />
			<ProfilePreferencesSection
				genres={content.genres}
				onModify={actions.onMusicPreferences}
				prominent={false}
			/>
			<ProfileInfoSection user={user} prominent={false} />
			<ProfileMenuItems actions={actions} />
			<ProfileBuildLabel label={content.buildLabel} />
		</>
	);
}
