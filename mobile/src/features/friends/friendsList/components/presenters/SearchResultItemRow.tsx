import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Avatar } from '@/shared/components/media/Avatar';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { UserProfile } from '@/features/friends/types';
import { createFriendsListStyles } from './friendsListStyles';

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
			<Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
		</Pressable>
	);
}
