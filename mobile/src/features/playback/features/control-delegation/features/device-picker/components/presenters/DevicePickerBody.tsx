import React from 'react';
import { ActivityIndicator } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { DevicePickerCentered } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/DevicePickerCentered';
import { DevicePickerError } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/DevicePickerError';
import { DevicePickerList } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/DevicePickerList';
import type {
	PickerRow,
	PickerSections,
	PickerStatus,
} from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';

type DevicePickerBodyProps = {
	status: PickerStatus;
	sections: PickerSections | null;
	onRetry: () => void;
	onPick: (row: PickerRow) => void;
};

export function DevicePickerBody({ status, sections, onRetry, onPick }: DevicePickerBodyProps) {
	const { theme } = useTheme();

	if (status.loading && !sections) {
		return (
			<DevicePickerCentered>
				<ActivityIndicator testID="picker-loading" size="large" color={theme.colors.primary} />
			</DevicePickerCentered>
		);
	}
	if (status.loadError || !sections) return <DevicePickerError onRetry={onRetry} />;
	return <DevicePickerList sections={sections} onPick={onPick} />;
}
