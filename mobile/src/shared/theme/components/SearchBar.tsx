import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SearchBarField } from '@/shared/theme/components/SearchBarField';
import { SearchBarTrailing } from '@/shared/theme/components/SearchBarTrailing';
import { useFieldFocus } from '@/shared/theme/hooks/useFieldFocus';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { focusedFieldStyle } from '@/shared/theme/lib/focusedFieldStyle';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { SearchBarInput } from '@/shared/theme/types/searchBarTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type SearchBarProps = {
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
	style?: StyleProp<ViewStyle>;
	loading?: boolean;
	input?: SearchBarInput;
};

export function SearchBar({
	value,
	onChangeText,
	placeholder = 'Rechercher…',
	style,
	loading = false,
	input = {},
}: SearchBarProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { focused, focusProps } = useFieldFocus();

	return (
		<View style={[styles.container, style, focused && focusedFieldStyle(theme.colors.primary)]}>
			<SearchBarField
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				input={input}
				{...focusProps}
			/>
			<SearchBarTrailing value={value} loading={loading} onClear={() => onChangeText('')} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			...pixelFrame(theme),
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.md,
			height: theme.controls.searchBar,
		},
	});
	return styles;
}
