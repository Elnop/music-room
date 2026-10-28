import React from 'react';
import { View, ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { useTheme } from '@/shared/theme/ThemeContext';
import { pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { focusedFieldStyle } from '@/shared/theme/fieldFocus';
import { useFieldFocus } from '@/shared/hooks/useFieldFocus';
import { Pressable } from '@/shared/components/ui/Pressable';
import { TextInput } from '@/shared/components/ui/TextInput';

interface SearchBarProps {
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
	style?: StyleProp<ViewStyle>;
	autoFocus?: boolean;
	/** Shows a spinner in the field while a search runs. */
	loading?: boolean;
	inputRef?: React.Ref<TextInput>;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

export function SearchBar({
	value,
	onChangeText,
	placeholder = 'Rechercher…',
	style,
	autoFocus = false,
	loading = false,
	inputRef,
}: SearchBarProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const { focused, focusProps } = useFieldFocus();

	return (
		<View style={[styles.container, style, focused && focusedFieldStyle(theme.colors.primary)]}>
			<PixelIcon
				name="search"
				size={20}
				color={theme.colors.textSecondary}
				style={styles.icon}
				testID="search-bar-icon"
			/>
			<TextInput
				ref={inputRef}
				style={styles.input}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={theme.colors.textSecondary}
				autoFocus={autoFocus}
				autoCapitalize="none"
				autoCorrect={false}
				returnKeyType="search"
				{...focusProps}
			/>
			{loading && (
				<ActivityIndicator
					size="small"
					color={theme.colors.textSecondary}
					style={styles.trailing}
					testID="search-bar-loading"
				/>
			)}
			{value.length > 0 && (
				<Pressable
					onPress={() => onChangeText('')}
					hitSlop={HIT_SLOP}
					style={[styles.trailing, styles.clear]}
					accessibilityLabel="Effacer la recherche"
				>
					<PixelIcon name="close" size={20} color={theme.colors.textSecondary} />
				</Pressable>
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			...pixelFrame(theme),
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.md,
			height: 44,
		},
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
		trailing: {
			marginLeft: theme.spacing.sm,
		},
		clear: {
		},
	});
