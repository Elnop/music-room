import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import type {
	UserDeviceWithLicenses,
	FriendUserSummary,
} from '@/features/playback/features/control-delegation/shared/delegation/lib/types';
import { DeviceCard } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/DeviceCard';
import { MyDevicesHeader } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/MyDevicesHeader';
import { MyDevicesLoadingView } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/MyDevicesLoadingView';
import { MyDevicesErrorView } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/MyDevicesErrorView';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';

interface MyDevicesViewProps {
	isLoading: boolean;
	loadFailed: boolean;
	isRefreshing: boolean;
	bottomPadding: number;
	devices: UserDeviceWithLicenses[];
	friends: FriendUserSummary[];
	allDevicesFriendIds: Set<string>;
	currentDeviceId: string | null;
	licensed: Set<string>;
	pending: Set<string>;
	pairKey: (deviceId: string, userId: string) => string;
	onRefresh: () => void;
	onToggle: (device: UserDeviceWithLicenses, friend: FriendUserSummary, grant: boolean) => void;
	onOpenRename: (device: UserDeviceWithLicenses) => void;
	onNavigateFriends: () => void;
}

export function MyDevicesView({
	isLoading,
	loadFailed,
	isRefreshing,
	bottomPadding,
	devices,
	friends,
	allDevicesFriendIds,
	currentDeviceId,
	licensed,
	pending,
	pairKey,
	onRefresh,
	onToggle,
	onOpenRename,
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
				contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
				refreshControl={refreshControl}
			>
				<MyDevicesHeader />

				{devices.length === 0 ? (
					<EmptyState
						icon={PhoneRingingLowSolid}
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
							allDevicesFriendIds={allDevicesFriendIds}
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
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
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
}
