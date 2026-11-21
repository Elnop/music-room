import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import type { RefreshControlProps, ViewStyle } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { UserDeviceWithLicenses } from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';
import { DeviceCardList } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/DeviceCardList';
import { MyDevicesHeader } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/MyDevicesHeader';
import type {
	DeviceAccess,
	DeviceActions,
} from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

type MyDevicesListProps = {
	bottomPadding: number;
	devices: UserDeviceWithLicenses[];
	currentDeviceId: string | null;
	access: DeviceAccess;
	actions: DeviceActions;
	refreshControl: React.ReactElement<RefreshControlProps>;
};

function bottomPaddingStyle(paddingBottom: number): ViewStyle {
	return { paddingBottom };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		root: { flex: 1, backgroundColor: theme.colors.background },
		scrollArea: { flex: 1 },
		scrollContent: { padding: theme.spacing.lg },
	});
	return styles;
}

export function MyDevicesList({ devices, currentDeviceId, ...rest }: MyDevicesListProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.root}>
			<ScrollView
				style={styles.scrollArea}
				contentContainerStyle={[styles.scrollContent, bottomPaddingStyle(rest.bottomPadding)]}
				refreshControl={rest.refreshControl}
			>
				<MyDevicesHeader />
				<DeviceCardList
					devices={devices}
					currentDeviceId={currentDeviceId}
					access={rest.access}
					actions={rest.actions}
				/>
			</ScrollView>
		</View>
	);
}
