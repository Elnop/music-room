import React from 'react';
import {
	View,
	TextInput,
	TouchableOpacity,
	ActivityIndicator,
	StyleSheet,
	type StyleProp,
	type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';

interface SearchBarProps {
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
	style?: StyleProp<ViewStyle>;
	autoFocus?: boolean;
	/** Shows a spinner in the field while a search runs (#307). */
	loading?: boolean;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

export function SearchBar({
	value,
	onChangeText,
	placeholder = 'Rechercher…',
	style,
	autoFocus = false,
	loading = false,
}: SearchBarProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={[styles.container, style]}>
			<Ionicons
				name="search"
				size={20}
				color={theme.colors.textSecondary}
				style={styles.icon}
				testID="search-bar-icon"
			/>
			<TextInput
				style={styles.input}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={theme.colors.textSecondary}
				autoFocus={autoFocus}
				autoCapitalize="none"
				autoCorrect={false}
				returnKeyType="search"
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
				<TouchableOpacity
					onPress={() => onChangeText('')}
					hitSlop={HIT_SLOP}
					style={styles.trailing}
					accessibilityRole="button"
					accessibilityLabel="Effacer la recherche"
				>
					<Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
				</TouchableOpacity>
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surfaceAlt,
			borderRadius: 8,
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
			fontWeight: theme.typography.weights.regular,
		},
		trailing: {
			marginLeft: theme.spacing.sm,
		},
	});
