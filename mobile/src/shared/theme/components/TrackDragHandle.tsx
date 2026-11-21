import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import BarsSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/bars-solid.svg';

type TrackDragHandleProps = {
	onDragStart: () => void;
};

export function TrackDragHandle({ onDragStart }: TrackDragHandleProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<Pressable
			onPressIn={onDragStart}
			hitSlop={10}
			style={styles.dragHandle}
			accessibilityLabel="Réordonner"
		>
			<PixelIcon icon={BarsSolid} color={theme.colors.textSecondary} />
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		dragHandle: {
			marginLeft: theme.spacing.sm,
			padding: theme.spacing.xs,
		},
	});
	return styles;
}
