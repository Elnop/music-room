import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';

type CoverBandProps = {
	color: string;
};

export function CoverBand({ color }: CoverBandProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme, color), [theme, color]);

	return <View style={styles.band} />;
}

function createStyles(theme: Theme, color: string) {
	const styles = StyleSheet.create({
		band: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			height: theme.controls.coverBand,
			backgroundColor: color,
		},
	});
	return styles;
}
