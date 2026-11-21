import React from 'react';
import { StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

type ShortcutKeyCapProps = {
	keys: string;
};

export function ShortcutKeyCap({ keys }: ShortcutKeyCapProps) {
	const { styles } = useThemedStyles(createStyles);
	return <Text style={styles.keys}>{keys}</Text>;
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		keys: {
			minWidth: theme.spacing.xl,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: theme.spacing.xs,
			borderWidth: theme.borders.hairline,
			borderColor: theme.colors.border,
			backgroundColor: theme.colors.surfaceAlt,
			textAlign: 'center',
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
	});
	return styles;
}
