import React from 'react';
import { View } from 'react-native';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import type { ViewedProfile } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { UserProfileWideHeader } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileWideHeader';
import { UserProfileWideSections } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileWideSections';

type UserProfileWideBodyProps = {
	viewed: ViewedProfile;
};

export function UserProfileWideBody({ viewed }: UserProfileWideBodyProps) {
	const column = useContentColumn();

	return (
		<View style={column}>
			<UserProfileWideHeader viewed={viewed} />
			<UserProfileWideSections viewed={viewed} />
		</View>
	);
}
