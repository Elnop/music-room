import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

type GenreSelectorIntroProps = {
	selectedCount: number;
	maxGenres: number;
};

export function GenreSelectorIntro({ selectedCount, maxGenres }: GenreSelectorIntroProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			<View style={styles.header}>
				<Text style={styles.counter}>
					{selectedCount}/{maxGenres} {selectedCount > 1 ? 'choisis' : 'choisi'}
				</Text>
			</View>

			<Text style={styles.description}>
				Choisissez jusqu'à {maxGenres} genres qui définissent vos goûts musicaux
			</Text>
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		header: {
			flexDirection: 'row',
			justifyContent: 'flex-end',
			alignItems: 'center',
			marginBottom: theme.spacing.xs,
		},
		counter: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.primary,
			fontFamily: theme.typography.families.medium,
		},
		description: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.lg,
		},
	});
	return styles;
}
