import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedSwitch } from '@/shared/theme/components/ThemedSwitch';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { ToggleCardText } from '@/features/playlists/features/editor/features/playlist-form/components/presenters/ToggleCardText';

type ToggleCardProps = {
	label: string;
	description: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
};

export function ToggleCard({ label, description, value, onValueChange }: ToggleCardProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.card}>
			<View style={styles.row}>
				<ToggleCardText label={label} description={description} />
				<ThemedSwitch value={value} onValueChange={onValueChange} />
			</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		card: {
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.md,
			borderWidth: theme.borders.medium,
			borderColor: theme.colors.border,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
		},
	});
	return styles;
}
