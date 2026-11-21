import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';

type HiddenFieldNoteProps = {
	label: string;
};

export function HiddenFieldNote({ label }: HiddenFieldNoteProps) {
	const { theme, styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.hiddenField}>
			<PixelIcon
				icon={LockSolid}
				size={16}
				color={theme.colors.textSecondary}
				style={styles.hiddenIcon}
			/>
			<Text style={styles.hiddenText}>{label}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		hiddenField: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: theme.spacing.sm,
			gap: theme.spacing.xsm,
		},
		hiddenIcon: {
			marginRight: theme.spacing.xs,
		},
		hiddenText: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			fontStyle: 'italic',
		},
	});
	return styles;
}
