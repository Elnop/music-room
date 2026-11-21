import React from 'react';
import { WideProfileHeader } from '@/features/user/shared/wide-profile-header/components/WideProfileHeader';
import type { WideProfileIdentity } from '@/features/user/shared/wide-profile-header/wideProfileHeaderTypes';
import type { ViewedProfile } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { UserProfileBadges } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileBadges';
import { UserProfileWideNotes } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileWideNotes';
import { WideFollowButton } from '@/features/user/features/friends/features/user-profile/components/presenters/WideFollowButton';
import { WideShareButton } from '@/features/user/features/friends/features/user-profile/components/presenters/WideShareButton';

type UserProfileWideHeaderProps = {
	viewed: ViewedProfile;
};

function wideIdentity({ profile, follow }: ViewedProfile): WideProfileIdentity {
	return {
		kind: follow.status?.isFriend ? 'Ami' : 'Profil',
		name: profile.displayName || profile.username,
		username: profile.username,
		avatarUrl: profile.avatarUrl,
		bio: profile.bio,
		followersCount: follow.status?.followersCount ?? 0,
		followingCount: follow.status?.followingCount ?? 0,
	};
}

export function UserProfileWideHeader({ viewed }: UserProfileWideHeaderProps) {
	const identity = wideIdentity(viewed);
	const { follow, listening } = viewed;

	return (
		<WideProfileHeader
			identity={identity}
			badges={
				<UserProfileBadges
					followStatus={follow.status}
					canControlMusic={listening.canControlMusic}
					hasDevicesOnline={listening.devices.length > 0}
				/>
			}
			notes={<UserProfileWideNotes viewed={viewed} />}
			actions={
				<>
					{follow.status && <WideFollowButton status={follow.status} follow={follow} />}
					<WideShareButton userId={viewed.userId} name={identity.name} />
				</>
			}
		/>
	);
}
