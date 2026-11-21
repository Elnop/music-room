import React from 'react';
import { StyleSheet } from 'react-native';
import { ShareLinkButton } from '@/shared/theme/components/ShareLinkButton';
import { userLink } from '@/shared/share-links/shareLinks';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { ViewedProfile } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { FollowButtons } from '@/features/user/features/friends/features/user-profile/components/presenters/FollowButtons';
import { UserProfileListening } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileListening';

type UserProfileActionsProps = {
	viewed: ViewedProfile;
};

export function UserProfileActions({ viewed }: UserProfileActionsProps) {
	const { styles } = useThemedStyles(createStyles);
	const { profile, follow, listening } = viewed;

	return (
		<>
			{follow.status && <FollowButtons status={follow.status} follow={follow} />}
			<ShareLinkButton
				url={userLink(viewed.userId)}
				title={profile.displayName || profile.username}
				style={styles.shareButton}
			/>
			{listening.canControlMusic && follow.status?.isFriend && !listening.isLoading && (
				<UserProfileListening listening={listening} />
			)}
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		shareButton: {
			alignSelf: 'flex-start',
			marginTop: theme.spacing.md,
		},
	});
	return styles;
}
