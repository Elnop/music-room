import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullScreenSheet } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';
import { AppToast } from '@/shared/theme/components/AppToast';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { DevicePickerBody } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/DevicePickerBody';
import { DevicePickerHeader } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/DevicePickerHeader';
import type { DevicePicker } from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type DevicePickerSheetViewProps = {
	visible: boolean;
	onClose: () => void;
	picker: DevicePicker;
};

function createStyles(theme: Theme, top: number) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
			paddingTop: top,
		},
	});
	return styles;
}

export function DevicePickerSheetView({ visible, onClose, picker }: DevicePickerSheetViewProps) {
	const { theme } = useTheme();
	const { top } = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, top), [theme, top]);

	return (
		<FullScreenSheet visible={visible} onClose={onClose}>
			<View style={styles.container}>
				<DevicePickerHeader onClose={onClose} />
				<DevicePickerBody
					status={picker.status}
					sections={picker.sections}
					onRetry={picker.onRetry}
					onPick={picker.onPick}
				/>
				<AppToast />
			</View>
		</FullScreenSheet>
	);
}
