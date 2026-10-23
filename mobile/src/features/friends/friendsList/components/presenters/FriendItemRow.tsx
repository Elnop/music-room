import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Avatar } from '@/shared/components/media/Avatar';
import { ThemedSwitch } from '@/shared/components/ui/ThemedSwitch';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { FriendProfile } from '@/features/friends/types';
import { createFriendsListStyles } from './friendsListStyles';

interface FriendItemRowProps {
	friend: FriendProfile;
	canControl: boolean;
	isToggling: boolean;
	disabled: boolean;
	onPress: (userId: string) => void;
	onToggleControl: (friendId: string, currentValue: boolean) => void;
}

export function FriendItemRow({
	friend,
	canControl,
	isToggling,
	disabled,
	onPress,
	onToggleControl,
}: FriendItemRowProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createFriendsListStyles(theme), [theme]);

	return (
		<Pressable
			style={[styles.userItem, isToggling && styles.userItemProcessing]}
			onPress={() => onPress(friend.id)}
			accessibilityRole="button"
			accessibilityLabel={friend.displayName || friend.username}
		>
			<Avatar size="md" name={friend.displayName || friend.username} uri={friend.avatarUrl} />
			<View style={styles.userInfo}>
				<Text style={styles.username}>{friend.username}</Text>
				{friend.displayName && <Text style={styles.displayName}>{friend.displayName}</Text>}
				<View style={styles.controlRow}>
					<Ionicons
						name="musical-notes"
						size={12}
						color={canControl ? theme.colors.primary : theme.colors.textSecondary}
						style={styles.controlIcon}
					/>
					<Text style={[styles.controlText, canControl && styles.controlTextActive]}>
						Tous mes appareils
					</Text>
				</View>
			</View>
			<View style={styles.controlToggle}>
				{isToggling ? (
					<View style={styles.switchPlaceholder}>
						<LoadingSpinner size="small" />
					</View>
				) : (
					<ThemedSwitch
						value={canControl}
						onValueChange={() => onToggleControl(friend.id, canControl)}
						disabled={disabled}
					/>
				)}
			</View>
			<Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
		</Pressable>
	);
}
