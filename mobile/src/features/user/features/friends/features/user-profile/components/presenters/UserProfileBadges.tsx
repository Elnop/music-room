import React from 'react';
import type { FollowStatus } from '@/features/user/features/friends/friendsTypes';
import { FollowsYouBadge } from '@/features/user/features/friends/features/user-profile/components/presenters/FollowsYouBadge';
import { OnlineStatusBadge } from '@/features/user/features/friends/features/user-profile/components/presenters/OnlineStatusBadge';

type UserProfileBadgesProps = {
	followStatus: FollowStatus | null;
	canControlMusic: boolean;
	hasDevicesOnline: boolean;
};

export function UserProfileBadges({
	followStatus,
	canControlMusic,
	hasDevicesOnline,
}: UserProfileBadgesProps) {
	return (
		<>
			{followStatus?.isFriend && canControlMusic && <OnlineStatusBadge online={hasDevicesOnline} />}
			{followStatus?.isFollowedBy && <FollowsYouBadge />}
		</>
	);
}
