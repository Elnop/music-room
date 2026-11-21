import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Pressable } from '@/shared/theme/components/Pressable';

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

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		card: {
			...pixelFrame(theme),
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.md,
		},
		elevation: {
			...theme.shadows.medium,
		},
	});
	return styles;
}
