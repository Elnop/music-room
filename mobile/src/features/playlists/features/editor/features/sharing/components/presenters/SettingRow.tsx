import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import { ThemedSwitch } from '@/shared/theme/components/ThemedSwitch';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { createSharingStyles } from '@/features/playlists/features/editor/features/sharing/components/presenters/createSharingStyles';
import { SettingInfo } from '@/features/playlists/features/editor/features/sharing/components/presenters/SettingInfo';

type SettingRowProps = {
	icon: PixelIconSource;
	label: string;
	description: string;
	value: boolean;
	onToggle: () => void;
	busy: boolean;
};

export function SettingRow({ icon, label, description, value, onToggle, busy }: SettingRowProps) {
	const { styles: shared } = useThemedStyles(createSharingStyles);

	return (
		<View style={[shared.card, shared.row, styles.item]}>
			<SettingInfo icon={icon} label={label} description={description} />
			{busy ? (
				<LoadingSpinner size="small" />
			) : (
				<ThemedSwitch value={value} onValueChange={onToggle} />
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	item: {
		justifyContent: 'space-between',
	},
});
