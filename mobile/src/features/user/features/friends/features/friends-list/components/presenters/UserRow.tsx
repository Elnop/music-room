import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Avatar } from '@/shared/theme/components/Avatar';
import { pixelRow } from '@/shared/theme/lib/pixelFrame';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { FriendProfile } from '@/features/user/features/friends/friendsTypes';
import { UserNames } from '@/features/user/features/friends/features/friends-list/components/presenters/UserNames';
import AngleRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/angle-right-solid.svg';

type UserRowProps = {
	user: FriendProfile;
	onPress: (userId: string) => void;
	dimmed?: boolean;
	hint?: React.ReactNode;
	trailing?: React.ReactNode;
};

export function UserRow({ user, onPress, dimmed = false, hint, trailing }: UserRowProps) {
	const { theme, styles } = useThemedStyles(createStyles);
	const name = user.displayName || user.username;

	return (
		<Pressable
			style={[styles.userItem, dimmed && styles.userItemProcessing]}
			onPress={() => onPress(user.id)}
			accessibilityRole="button"
			accessibilityLabel={name}
		>
			<Avatar size="md" name={name} uri={user.avatarUrl} />
			<UserNames user={user}>{hint}</UserNames>
			{trailing}
			<PixelIcon icon={AngleRightSolid} size={20} color={theme.colors.textSecondary} />
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		userItem: pixelRow(theme),
		userItemProcessing: {
			opacity: 0.7,
		},
	});
	return styles;
}
