import React from 'react';
import { WideProfileHeader } from '@/features/user/shared/wide-profile-header/components/WideProfileHeader';
import type { WideProfileIdentity } from '@/features/user/shared/wide-profile-header/wideProfileHeaderTypes';
import { ProfileWideActions } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileWideActions';
import type { ProfileActions } from '@/features/user/features/profile/features/profile-screen/profileScreenTypes';
import type { UserProfile } from '@/shared/users/userTypes';
import type { UserStats } from '@/features/user/features/profile/profileTypes';

type ProfileWideHeaderProps = {
	user: UserProfile;
	stats?: UserStats | null;
	actions: ProfileActions;
};

export function ProfileWideHeader({ user, stats, actions }: ProfileWideHeaderProps) {
	return (
		<WideProfileHeader
			identity={profileIdentity(user, stats)}
			actions={<ProfileWideActions actions={actions} />}
		/>
	);
}

function profileIdentity(user: UserProfile, stats?: UserStats | null): WideProfileIdentity {
	return {
		kind: 'Mon profil',
		name: user.displayName || user.username,
		username: user.username,
		avatarUrl: user.avatarUrl,
		bio: user.bio,
		followersCount: stats?.followersCount ?? 0,
		followingCount: stats?.followingCount ?? 0,
	};
}
