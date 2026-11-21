import React from 'react';
import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';

type WideProfileTitleProps = {
	kind: string;
	name: string;
};

export function WideProfileTitle({ kind, name }: WideProfileTitleProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			<Text style={styles.kind}>{kind}</Text>
			<Text style={styles.name} numberOfLines={2}>
				{name}
			</Text>
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		kind: {
			color: theme.colors.textSecondary,
			textTransform: 'uppercase',
			letterSpacing: theme.typography.letterSpacings.caption,
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
		},
		name: {
			marginTop: theme.spacing.xs,
			color: theme.colors.text,
			...displayText(theme, theme.typography.sizes.xxxl),
		},
	});
	return styles;
}
