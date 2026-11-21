import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type ProfileBuildLabelProps = {
	label: string;
};

export function ProfileBuildLabel({ label }: ProfileBuildLabelProps) {
	const { styles } = useThemedStyles(createStyles);

	return <Text style={styles.buildLabel}>{label}</Text>;
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		buildLabel: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			textAlign: 'center',
			marginTop: theme.spacing.lg,
		},
	});
	return styles;
}
