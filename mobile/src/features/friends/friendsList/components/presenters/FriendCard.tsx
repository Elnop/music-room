import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/shared/components/media/Avatar';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { FriendProfile } from '@/features/friends/types';
import { ControlSwitch } from './ControlSwitch';
import { createFriendsListStyles } from './friendsListStyles';
import { Text } from '@/shared/components/ui/Text';

interface FriendCardProps {
	friend: FriendProfile;
	canControl: boolean;
	isToggling: boolean;
	disabled: boolean;
	onPress: (userId: string) => void;
	onToggleControl: (friendId: string, currentValue: boolean) => void;
}

/** A friend on wide screens: the card opens the profile, its footer says what the switch grants. */
export function FriendCard({
	friend,
	canControl,
	isToggling,
	disabled,
	onPress,
	onToggleControl,
}: FriendCardProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createFriendsListStyles(theme), [theme]);
	const name = friend.displayName || friend.username;
	const controlLabel = 'Peut contrôler ma musique sur tous mes appareils';

	return (
		<View style={isToggling && styles.userItemProcessing}>
			<Pressable
				style={styles.cardHeader}
				onPress={() => onPress(friend.id)}
				accessibilityLabel={name}
			>
				<Avatar size="md" name={name} uri={friend.avatarUrl} />
				<View style={styles.userInfo}>
					<Text style={styles.username} numberOfLines={1}>
						{friend.username}
					</Text>
					{friend.displayName && (
						<Text style={styles.displayName} numberOfLines={1}>
							{friend.displayName}
						</Text>
					)}
				</View>
				<Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
			</Pressable>
			<View style={styles.cardFooter}>
				<Ionicons
					name="musical-notes"
					size={14}
					color={canControl ? theme.colors.primary : theme.colors.textSecondary}
				/>
				<Text style={[styles.cardFooterText, canControl && styles.controlTextActive]}>
					{controlLabel}
				</Text>
				<ControlSwitch
					canControl={canControl}
					isToggling={isToggling}
					disabled={disabled}
					onToggle={() => onToggleControl(friend.id, canControl)}
					accessibilityLabel={`${name} ${controlLabel.toLowerCase()}`}
				/>
			</View>
		</View>
	);
}
