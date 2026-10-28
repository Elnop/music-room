import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Pressable } from './Pressable';

/** A pressable card names its action for screen readers. */
type CardPress =
	| { onPress?: undefined; accessibilityLabel?: undefined }
	| { onPress: () => void; accessibilityLabel: string };

type CardProps = CardPress & {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	elevation?: boolean;
};

export function Card({
	children,
	onPress,
	accessibilityLabel,
	style,
	elevation = true,
}: CardProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const cardStyle = [styles.card, elevation && styles.elevation, style];

	if (onPress && accessibilityLabel !== undefined) {
		return (
			<Pressable style={cardStyle} onPress={onPress} accessibilityLabel={accessibilityLabel}>
				{children}
			</Pressable>
		);
	}
	return <View style={cardStyle}>{children}</View>;
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		card: {
			backgroundColor: theme.colors.surface,
			borderWidth: theme.borders.thick,
			borderColor: theme.colors.border,
			padding: theme.spacing.md,
		},
		elevation: {
			...theme.shadows.medium,
		},
	});
