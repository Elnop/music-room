import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { DeviceRow } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/DeviceRow';
import type {
	PickerFriendGroup,
	PickerRow,
} from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type PickerFriendDevicesProps = {
	group: PickerFriendGroup;
	onPick: (row: PickerRow) => void;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		ownerName: {
			paddingHorizontal: theme.spacing.md,
			paddingTop: theme.spacing.sm,
			paddingBottom: theme.spacing.xs,
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
	});
	return styles;
}

export function PickerFriendDevices({ group, onPick }: PickerFriendDevicesProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View>
			<Text style={styles.ownerName}>{group.owner.username}</Text>
			{group.rows.map(row => (
				<DeviceRow key={row.key} row={row} onPick={onPick} />
			))}
		</View>
	);
}
