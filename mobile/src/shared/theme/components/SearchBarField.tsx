import React from 'react';
import { StyleSheet } from 'react-native';
import type { TextInputProps } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { TextInput } from '@/shared/theme/components/TextInput';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { SearchBarInput } from '@/shared/theme/types/searchBarTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import SearchSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/search-solid.svg';

type SearchBarFieldProps = Pick<
	TextInputProps,
	'value' | 'onChangeText' | 'placeholder' | 'onFocus' | 'onBlur'
> & {
	input: SearchBarInput;
};

export function SearchBarField({ input, ...field }: SearchBarFieldProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { inputRef, autoFocus = false } = input;
	return (
		<>
			<PixelIcon
				icon={SearchSolid}
				size={20}
				color={theme.colors.textSecondary}
				style={styles.icon}
				testID="search-bar-icon"
			/>
			<TextInput
				{...field}
				ref={inputRef}
				style={styles.input}
				placeholderTextColor={theme.colors.textSecondary}
				autoFocus={autoFocus}
				autoCapitalize="none"
				autoCorrect={false}
				returnKeyType="search"
			/>
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		icon: {
			marginRight: theme.spacing.sm,
		},
		input: {
			flex: 1,
			fontSize: theme.typography.sizes.md,
			color: theme.colors.text,
			padding: 0,
			fontFamily: theme.typography.families.regular,
		},
	});
	return styles;
}
