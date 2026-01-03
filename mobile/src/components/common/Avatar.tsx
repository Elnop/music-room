import React from 'react';
import { View, Image, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';

interface AvatarProps {
	uri?: string;
	size?: 'sm' | 'md' | 'lg';
	name?: string;
	style?: StyleProp<ViewStyle>;
}

const SIZE_MAP = {
	sm: 32,
	md: 48,
	lg: 80,
};

export function Avatar({ uri, size = 'md', name, style }: AvatarProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const dimension = SIZE_MAP[size];
	const fontSize =
		size === 'sm'
			? theme.typography.sizes.xs
			: size === 'md'
				? theme.typography.sizes.md
				: theme.typography.sizes.xl;

	const getInitials = (name?: string): string => {
		if (!name) return '?';
		const parts = name.trim().split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	};

	return (
		<View
			style={[
				styles.container,
				{
					width: dimension,
					height: dimension,
					borderRadius: dimension / 2,
				},
				style,
			]}
		>
			{uri ? (
				<Image
					source={{ uri }}
					style={[
						styles.image,
						{
							width: dimension,
							height: dimension,
							borderRadius: dimension / 2,
						},
					]}
				/>
			) : (
				<Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			backgroundColor: theme.colors.surfaceAlt,
			justifyContent: 'center',
			alignItems: 'center',
			overflow: 'hidden',
			borderWidth: theme.borders.medium,
			borderColor: theme.colors.border,
		},
		image: {
			resizeMode: 'cover',
		},
		initials: {
			color: theme.colors.text,
			fontWeight: theme.typography.weights.bold,
		},
	});
