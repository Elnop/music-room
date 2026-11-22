import React from 'react';
import { ScrollView } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { THIS_DEVICE_LABEL } from '@/shared/platform/platformConfig';
import { DeviceRow } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/DeviceRow';
import { PickerFriendDevices } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/PickerFriendDevices';
import { PickerSection } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/PickerSection';
import type {
	PickerRow,
	PickerSections,
} from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';

type DevicePickerListProps = {
	sections: PickerSections;
	onPick: (row: PickerRow) => void;
};

function bottomPadding(paddingBottom: number): ViewStyle {
	return { paddingBottom };
}

export function DevicePickerList({ sections, onPick }: DevicePickerListProps) {
	const { theme } = useTheme();
	const { bottom } = useSafeAreaInsets();
	const { phone, myOthers, friends } = sections;

	return (
		<ScrollView contentContainerStyle={bottomPadding(bottom + theme.spacing.md)}>
			<PickerSection
				label={THIS_DEVICE_LABEL}
				emptyText={`${THIS_DEVICE_LABEL} n'est pas encore enregistré`}
			>
				{phone && <DeviceRow row={phone} onPick={onPick} />}
			</PickerSection>
			<PickerSection label="Mes appareils" emptyText="Aucun autre appareil">
				{myOthers.length > 0 &&
					myOthers.map((row) => <DeviceRow key={row.key} row={row} onPick={onPick} />)}
			</PickerSection>
			<PickerSection label="Appareils de mes amis" emptyText="Aucun appareil d'ami à contrôler">
				{friends.length > 0 &&
					friends.map((group) => (
						<PickerFriendDevices key={group.owner.ownerId} group={group} onPick={onPick} />
					))}
			</PickerSection>
		</ScrollView>
	);
}
