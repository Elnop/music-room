import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SearchBar } from '@/shared/theme/components/SearchBar';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import type { SearchField } from '@/features/search/searchTypes';

type SearchHeaderProps = {
	field: SearchField;
	loading: boolean;
};

export function SearchHeader({ field, loading }: SearchHeaderProps) {
	const { styles } = useThemedStyles(createStyles);
	const column = useContentColumn();

	return (
		<View style={[styles.header, column]}>
			<SearchBar
				input={{ inputRef: field.inputRef }}
				value={field.searchQuery}
				onChangeText={field.onSearchChange}
				placeholder="Rechercher sur SoundCloud..."
				loading={loading}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		header: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.xs,
			paddingBottom: theme.spacing.md,
		},
	});
	return styles;
}
