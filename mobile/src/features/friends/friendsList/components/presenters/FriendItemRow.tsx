import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Avatar } from '@/shared/components/media/Avatar';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { FriendProfile } from '@/features/friends/types';
import { ControlSwitch } from './ControlSwitch';
import { createFriendsListStyles } from './friendsListStyles';
import { Text } from '@/shared/components/ui/Text';

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
					<PixelIcon
						name="note"
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
				<ControlSwitch
					canControl={canControl}
					isToggling={isToggling}
					disabled={disabled}
					onToggle={() => onToggleControl(friend.id, canControl)}
					accessibilityLabel={`${friend.displayName || friend.username} peut contrôler ma musique`}
				/>
			</View>
			<PixelIcon name="right" size={20} color={theme.colors.textSecondary} />
		</Pressable>
	);
}
