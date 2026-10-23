import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import type { UserDeviceWithLicenses } from '@/features/music-control/types';
import type { FriendUserSummary } from '@/shared/services/friendsBridge';
import { DeviceFriendRow } from './DeviceFriendRow';
import { DeviceHeader } from './DeviceHeader';

interface DeviceCardProps {
	device: UserDeviceWithLicenses;
	isCurrent: boolean;
	friends: FriendUserSummary[];
	allDevicesIds: Set<string>;
	licensed: Set<string>;
	pending: Set<string>;
	pairKey: (deviceId: string, userId: string) => string;
	onToggle: (device: UserDeviceWithLicenses, friend: FriendUserSummary, grant: boolean) => void;
	onOpenRename: (device: UserDeviceWithLicenses) => void;
	onNavigateFriends: () => void;
}

export function DeviceCard({
	device,
	isCurrent,
	friends,
	allDevicesIds,
	licensed,
	pending,
	pairKey,
	onToggle,
	onOpenRename,
	onNavigateFriends,
}: DeviceCardProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.card} testID={`device-${device.deviceId}`}>
			<DeviceHeader device={device} isCurrent={isCurrent} onOpenRename={onOpenRename} />
			<View style={styles.divider} />
			{friends.length === 0 ? (
				<EmptyState
					style={styles.emptyState}
					message="Aucun ami pour l'instant. Suivez des personnes qui vous suivent en retour : elles deviendront vos amis et vous pourrez leur confier cet appareil."
					action={{
						label: 'Trouver des amis',
						onPress: onNavigateFriends,
					}}
				/>
			) : (
				friends.map(friend => {
					const key = pairKey(device.deviceId, friend.id);
					const allDevices = allDevicesIds.has(friend.id);
					const isPending = pending.has(key);
					const value = allDevices || licensed.has(key);

					return (
						<DeviceFriendRow
							key={friend.id}
							friend={friend}
							deviceName={device.deviceName}
							value={value}
							disabled={allDevices || isPending}
							isPending={isPending}
							allDevices={allDevices}
							onToggle={next => onToggle(device, friend, next)}
							testID={`license-row-${key}`}
						/>
					);
				})
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		card: {
			backgroundColor: theme.colors.surface,
			borderRadius: 16,
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: theme.spacing.sm,
			marginBottom: theme.spacing.lg,
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
			marginVertical: theme.spacing.xs,
		},
		emptyState: {
			flex: 0,
			padding: theme.spacing.md,
		},
	});
