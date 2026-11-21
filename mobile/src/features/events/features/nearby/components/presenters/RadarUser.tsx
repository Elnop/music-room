import React from 'react';
import { StyleSheet, View } from 'react-native';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { RADAR_USER } from '@/features/events/features/nearby/configs/radarConfig';

export function RadarUser() {
	const { styles } = useThemedStyles(createStyles);
	return <View style={styles.user} />;
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		user: {
			...pixelFrame(theme),
			position: 'absolute',
			left: '50%',
			bottom: 0,
			width: RADAR_USER.size,
			height: RADAR_USER.size,
			marginLeft: RADAR_USER.offset,
			backgroundColor: theme.colors.primary,
		},
	});
	return styles;
}
