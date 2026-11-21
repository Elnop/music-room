import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type TrackTableHeaderLabelProps = {
	label: string;
	style: StyleProp<ViewStyle>;
};

export function TrackTableHeaderLabel({ label, style }: TrackTableHeaderLabelProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={style}>
			<Text style={styles.label}>{label}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		label: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
