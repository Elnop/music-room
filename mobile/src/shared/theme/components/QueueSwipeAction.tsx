import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import PlaylistSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/playlist-solid.svg';

const QUEUE_ACTION_WIDTH = 100;

export function QueueSwipeAction() {
	const { styles, theme } = useThemedStyles(createStyles);
	return (
		<View style={styles.queueAction} accessible accessibilityLabel="Ajouter à la file d'attente">
			<PixelIcon icon={PlaylistSolid} size={24} color={theme.colors.onColor} />
			<Text style={styles.queueText}>À la file</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		queueAction: {
			backgroundColor: theme.colors.primary,
			justifyContent: 'center',
			alignItems: 'center',
			width: QUEUE_ACTION_WIDTH,
			height: '100%',
		},
		queueText: {
			color: theme.colors.onColor,
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			marginTop: theme.spacing.xs,
		},
	});
	return styles;
}
