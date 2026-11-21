import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { FollowStatus } from '@/features/user/features/friends/friendsTypes';
import type { ProfileFollow } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import CheckSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/check-solid.svg';
import UserPlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/user-plus-solid.svg';

type WideFollowButtonProps = {
	status: FollowStatus;
	follow: ProfileFollow;
};

export function WideFollowButton({ status, follow }: WideFollowButtonProps) {
	const { theme, styles } = useThemedStyles(createStyles);

	return (
		<Button
			variant={status.isFollowing ? 'secondary' : 'primary'}
			onPress={follow.onToggle}
			loading={follow.isLoading}
			style={styles.action}
			accessibilityLabel={status.isFollowing ? 'Ne plus suivre' : 'Suivre'}
			icon={
				<PixelIcon
					icon={status.isFollowing ? CheckSolid : UserPlusSolid}
					size={18}
					color={status.isFollowing ? theme.colors.text : theme.colors.onColor}
				/>
			}
			title={status.isFollowing ? 'Abonné' : 'Suivre'}
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		action: {
			height: theme.controls.buttonMedium,
			paddingHorizontal: theme.spacing.md,
		},
	});
	return styles;
}
