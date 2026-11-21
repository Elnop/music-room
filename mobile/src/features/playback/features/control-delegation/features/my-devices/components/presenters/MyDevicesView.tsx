import React from 'react';
import { RefreshControl } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { UserDeviceWithLicenses } from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';
import { MyDevicesList } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/MyDevicesList';
import { MyDevicesLoadingView } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/MyDevicesLoadingView';
import { MyDevicesErrorView } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/MyDevicesErrorView';
import type {
	DeviceAccess,
	DeviceActions,
	MyDevicesStatus,
} from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

type MyDevicesViewProps = {
	status: MyDevicesStatus;
	bottomPadding: number;
	devices: UserDeviceWithLicenses[];
	currentDeviceId: string | null;
	access: DeviceAccess;
	actions: DeviceActions;
};

export function MyDevicesView({ status, ...list }: MyDevicesViewProps) {
	const { theme } = useTheme();

	const refreshControl = (
		<RefreshControl
			refreshing={status.isRefreshing}
			onRefresh={list.actions.onRefresh}
			tintColor={theme.colors.primary}
			colors={[theme.colors.primary]}
		/>
	);

	if (status.isLoading) return <MyDevicesLoadingView />;
	if (status.loadFailed) return <MyDevicesErrorView refreshControl={refreshControl} />;
	return <MyDevicesList {...list} refreshControl={refreshControl} />;
}
