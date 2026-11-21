import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PickerDevice } from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type DeviceRowLabelProps = {
	device: PickerDevice;
	active: boolean;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		rowText: { flex: 1 },
		deviceName: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		activeText: { color: theme.colors.primary },
		deviceModel: { fontSize: theme.typography.sizes.smd, color: theme.colors.textSecondary },
	});
	return styles;
}

export function DeviceRowLabel({ device, active }: DeviceRowLabelProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.rowText}>
			<Text style={[styles.deviceName, active && styles.activeText]} numberOfLines={1}>
				{device.deviceName}
			</Text>
			<Text style={styles.deviceModel} numberOfLines={1}>
				{device.online ? device.model : 'Hors ligne'}
			</Text>
		</View>
	);
}
