import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Avatar } from '@/shared/components/media/Avatar';
import { ThemedSwitch } from '@/shared/components/ui/ThemedSwitch';
import type { FriendUserSummary } from '@/shared/services/friendsBridge';

interface DeviceFriendRowProps {
	friend: FriendUserSummary;
	deviceName: string;
	value: boolean;
	disabled: boolean;
	isPending: boolean;
	allDevices: boolean;
	onToggle: (next: boolean) => void;
	testID?: string;
}

export function DeviceFriendRow({
	friend,
	deviceName,
	value,
	disabled,
	isPending,
	allDevices,
	onToggle,
	testID,
}: DeviceFriendRowProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const name = friend.displayName || friend.username;

	return (
		<View style={styles.friendRow} testID={testID}>
			<Avatar size="sm" name={name} uri={friend.avatarUrl ?? undefined} />
			<View style={styles.textContainer}>
				<Text style={styles.friendName}>{name}</Text>
				{allDevices && <Text style={styles.hint}>Contrôle tous mes appareils</Text>}
			</View>
			<ThemedSwitch
				value={value}
				onValueChange={onToggle}
				disabled={disabled}
				accessibilityLabel={`${name} sur ${deviceName}`}
				accessibilityState={{ disabled, busy: isPending }}
			/>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		friendRow: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
			gap: theme.spacing.md,
		},
		textContainer: {
			flex: 1,
			marginRight: theme.spacing.sm,
		},
		friendName: {
			fontSize: 15,
			color: theme.colors.text,
		},
		hint: {
			fontSize: 12,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
	});
