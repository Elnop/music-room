import React from 'react';
import type { ViewedProfile } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { FollowBackHint } from '@/features/user/features/friends/features/user-profile/components/presenters/FollowBackHint';
import { HiddenFieldNote } from '@/features/user/features/friends/features/user-profile/components/presenters/HiddenFieldNote';

type UserProfileWideNotesProps = {
	viewed: ViewedProfile;
};

export function UserProfileWideNotes({ viewed }: UserProfileWideNotesProps) {
	const isFriend = viewed.follow.status?.isFriend ?? false;

	return (
		<>
			{viewed.profile.bio === undefined && (
				<HiddenFieldNote label={isFriend ? 'Bio privée' : 'Visible uniquement par ses amis'} />
			)}
			<FollowBackHint followStatus={viewed.follow.status} />
		</>
	);
}
