import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme, ThemeName } from '@/shared/theme/types';

// Theme metadata for selector
const AVAILABLE_THEMES: Array<{
	name: ThemeName;
	displayName: string;
	primaryColor: string;
	icon: keyof typeof Ionicons.glyphMap;
}> = [
	{ name: 'original', displayName: 'Original', primaryColor: '#EA3E7A', icon: 'musical-notes' },
	{ name: 'royalBlue', displayName: 'Bleu royal', primaryColor: '#1E3A8A', icon: 'sparkles' },
	{ name: 'christmas', displayName: 'Noël', primaryColor: '#DC2626', icon: 'snow' },
	{ name: 'pastelLime', displayName: 'Lime', primaryColor: '#84CC16', icon: 'leaf' },
];

export function ThemeSelector() {
	const { theme, themeName, setTheme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			{AVAILABLE_THEMES.map(themeOption => {
				const isSelected = themeName === themeOption.name;
				return (
					<Pressable
						key={themeOption.name}
						style={[
							styles.themeButton,
							{ borderColor: themeOption.primaryColor },
							isSelected && styles.themeButtonSelected,
							isSelected && { backgroundColor: themeOption.primaryColor },
						]}
						onPress={() => setTheme(themeOption.name)}
						accessibilityLabel={themeOption.displayName}
						accessibilityState={{ selected: isSelected }}
					>
						<Ionicons
							name={themeOption.icon}
							size={24}
							color={isSelected ? '#FFFFFF' : themeOption.primaryColor}
							style={styles.themeIcon}
						/>
						<Text style={[styles.themeName, isSelected && styles.themeNameSelected]}>
							{themeOption.displayName}
						</Text>
						{isSelected && (
							<View style={styles.checkmarkContainer}>
								<Ionicons name="checkmark" size={12} color="#FFFFFF" />
							</View>
						)}
					</Pressable>
				);
			})}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			gap: theme.spacing.sm,
		},
		themeButton: {
			flex: 1,
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			paddingVertical: theme.spacing.md,
			paddingHorizontal: theme.spacing.sm,
			borderRadius: 12,
			borderWidth: 2,
			backgroundColor: theme.colors.surface,
		},
		themeButtonSelected: {
			borderWidth: 3,
		},
		themeIcon: {
			marginBottom: theme.spacing.xs,
		},
		themeName: {
			fontSize: 12,
			fontWeight: theme.typography.weights.medium,
			color: theme.colors.text,
			textAlign: 'center',
		},
		themeNameSelected: {
			color: '#FFFFFF',
			fontWeight: theme.typography.weights.bold,
		},
		checkmarkContainer: {
			position: 'absolute',
			top: 4,
			right: 6,
		},
	});
