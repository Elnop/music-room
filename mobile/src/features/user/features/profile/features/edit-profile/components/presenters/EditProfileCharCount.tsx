import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type EditProfileCharCountProps = {
	length: number;
	max: number;
};

export function EditProfileCharCount({ length, max }: EditProfileCharCountProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Text style={styles.charCount}>
			{length}/{max}
		</Text>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		charCount: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			textAlign: 'right',
			marginBottom: theme.spacing.sm,
		},
	});
	return styles;
}
