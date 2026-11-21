import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Avatar } from '@/shared/theme/components/Avatar';
import { ThemedSwitch } from '@/shared/theme/components/ThemedSwitch';
import { Text } from '@/shared/theme/components/Text';
import { friendName } from '@/features/playback/features/control-delegation/features/my-devices/lib/devicePermissions';
import { friendRowLayout } from '@/features/playback/features/control-delegation/features/my-devices/lib/friendRowLayout';
import type { FriendLicense } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

type DeviceFriendRowProps = {
	license: FriendLicense;
	deviceName: string;
	onToggle: (next: boolean) => void;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		...friendRowLayout(theme),
		friendName: { fontSize: theme.typography.sizes.mdl, color: theme.colors.text },
		hint: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xxs,
		},
	});
	return styles;
}

export function DeviceFriendRow({ license, deviceName, onToggle }: DeviceFriendRowProps) {
	const { styles } = useThemedStyles(createStyles);
	const { friend, disabled } = license;
	const name = friendName(friend);

	return (
		<View style={styles.friendRow} testID={`license-row-${license.key}`}>
			<Avatar size="sm" name={name} uri={friend.avatarUrl ?? undefined} />
			<View style={styles.textContainer}>
				<Text style={styles.friendName}>{name}</Text>
				{license.allDevices && <Text style={styles.hint}>Contrôle tous mes appareils</Text>}
			</View>
			<ThemedSwitch
				value={license.value}
				onValueChange={onToggle}
				disabled={disabled}
				accessibilityLabel={`${name} sur ${deviceName}`}
				accessibilityState={{ disabled, busy: license.isPending }}
			/>
		</View>
	);
}
