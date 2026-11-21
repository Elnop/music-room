import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type SectionHeaderLabelProps = {
	icon: PixelIconSource;
	count: number;
};

export function SectionHeaderLabel({ icon, count }: SectionHeaderLabelProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	return (
		<View style={styles.label}>
			<PixelIcon icon={icon} size={18} color={theme.colors.textSecondary} />
			{count > 0 && <Text style={styles.count}>{count}</Text>}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		label: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
		count: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
