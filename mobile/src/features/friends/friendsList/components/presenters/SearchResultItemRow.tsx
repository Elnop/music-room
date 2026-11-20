import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Avatar } from '@/shared/theme/components/Avatar';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { UserProfile } from '@/features/friends/types';
import { createFriendsListStyles } from './friendsListStyles';
import { Text } from '@/shared/theme/components/Text';
import AngleRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/angle-right-solid.svg';

interface SearchResultItemRowProps {
	user: UserProfile;
	onPress: (userId: string) => void;
}

export function SearchResultItemRow({ user, onPress }: SearchResultItemRowProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createFriendsListStyles(theme), [theme]);

	return (
		<Pressable
			style={styles.userItem}
			onPress={() => onPress(user.id)}
			accessibilityRole="button"
			accessibilityLabel={user.displayName || user.username}
		>
			<Avatar size="md" name={user.displayName || user.username} uri={user.avatarUrl} />
			<View style={styles.userInfo}>
				<Text style={styles.username}>{user.username}</Text>
				{user.displayName && <Text style={styles.displayName}>{user.displayName}</Text>}
			</View>
			<PixelIcon icon={AngleRightSolid} size={20} color={theme.colors.textSecondary} />
		</Pressable>
	);
}
