import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import type { UserDeviceWithLicenses } from '@/features/music-control/types';
import type { FriendUserSummary } from '@/shared/services/friendsBridge';
import { DeviceCard } from './DeviceCard';
import { RenameDeviceModal } from './RenameDeviceModal';
import { MyDevicesHeader, MyDevicesLoadingView, MyDevicesErrorView } from './MyDevicesStates';

interface MyDevicesViewProps {
	isLoading: boolean;
	loadFailed: boolean;
	isRefreshing: boolean;
	playerHeight: number;
	devices: UserDeviceWithLicenses[];
	friends: FriendUserSummary[];
	allDevicesIds: Set<string>;
	currentDeviceId: string | null;
	licensed: Set<string>;
	pending: Set<string>;
	renamingDevice: UserDeviceWithLicenses | null;
	isRenameSaving: boolean;
	pairKey: (deviceId: string, userId: string) => string;
	onRefresh: () => void;
	onToggle: (device: UserDeviceWithLicenses, friend: FriendUserSummary, grant: boolean) => void;
	onOpenRename: (device: UserDeviceWithLicenses) => void;
	onCloseRename: () => void;
	onSubmitRename: (name: string | null) => void;
	onNavigateFriends: () => void;
}

export function MyDevicesView({
	isLoading,
	loadFailed,
	isRefreshing,
	playerHeight,
	devices,
	friends,
	allDevicesIds,
	currentDeviceId,
	licensed,
	pending,
	renamingDevice,
	isRenameSaving,
	pairKey,
	onRefresh,
	onToggle,
	onOpenRename,
	onCloseRename,
	onSubmitRename,
	onNavigateFriends,
}: MyDevicesViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const refreshControl = (
		<RefreshControl
			refreshing={isRefreshing}
			onRefresh={onRefresh}
			tintColor={theme.colors.primary}
			colors={[theme.colors.primary]}
		/>
	);

	if (isLoading) {
		return <MyDevicesLoadingView />;
	}

	if (loadFailed) {
		return <MyDevicesErrorView refreshControl={refreshControl} />;
	}

	return (
		<View style={styles.root}>
			<ScrollView
				style={styles.scrollArea}
				contentContainerStyle={[styles.scrollContent, { paddingBottom: playerHeight + theme.spacing.xl }]}
				refreshControl={refreshControl}
			>
				<MyDevicesHeader />

				{devices.length === 0 ? (
					<EmptyState
						icon="phone-portrait-outline"
						style={styles.emptyState}
						message="Aucun appareil. Ouvrez Zumik sur un appareil pour le voir ici."
					/>
				) : (
					devices.map(device => (
						<DeviceCard
							key={device.deviceId}
							device={device}
							isCurrent={device.deviceId === currentDeviceId}
							friends={friends}
							allDevicesIds={allDevicesIds}
							licensed={licensed}
							pending={pending}
							pairKey={pairKey}
							onToggle={onToggle}
							onOpenRename={onOpenRename}
							onNavigateFriends={onNavigateFriends}
						/>
					))
				)}
			</ScrollView>
			<RenameDeviceModal
				deviceName={renamingDevice?.deviceName ?? null}
				saving={isRenameSaving}
				onClose={onCloseRename}
				onSubmit={onSubmitRename}
			/>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		root: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		scrollArea: {
			flex: 1,
		},
		scrollContent: {
			padding: theme.spacing.lg,
		},
		emptyState: {
			flex: 0,
			padding: theme.spacing.md,
		},
	});
