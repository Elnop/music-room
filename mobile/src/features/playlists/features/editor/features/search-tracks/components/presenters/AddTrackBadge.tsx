import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import CheckSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/check-solid.svg';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';

type AddTrackBadgeProps = {
	trackId: number;
	isAdded: boolean;
};

export function AddTrackBadge({ trackId, isAdded }: AddTrackBadgeProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={[styles.addButton, isAdded && styles.addedButton]}>
			<PixelIcon
				icon={isAdded ? CheckSolid : PlusSolid}
				size={20}
				color={theme.colors.onColor}
				testID={`${isAdded ? 'added' : 'add'}-${trackId}`}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		addButton: {
			backgroundColor: theme.colors.primary,
			width: theme.controls.rowIcon,
			height: theme.controls.rowIcon,
			justifyContent: 'center',
			alignItems: 'center',
			marginLeft: theme.spacing.sm,
		},
		addedButton: {
			backgroundColor: theme.colors.success,
		},
	});
	return styles;
}
