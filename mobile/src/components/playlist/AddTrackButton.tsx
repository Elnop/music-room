import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';

interface AddTrackButtonProps {
	onPress: () => void;
}

export function AddTrackButton({ onPress }: AddTrackButtonProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
			<Text style={styles.icon}>+</Text>
		</TouchableOpacity>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		fab: {
			position: 'absolute',
			right: theme.spacing.lg,
			bottom: theme.spacing.lg,
			width: 56,
			height: 56,
			borderRadius: 28,
			backgroundColor: theme.colors.primary,
			justifyContent: 'center',
			alignItems: 'center',
			borderWidth: theme.borders.thick,
			borderColor: theme.colors.border,
			...theme.shadows.large,
		},
		icon: {
			fontSize: 32,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.textInverse,
		},
	});
