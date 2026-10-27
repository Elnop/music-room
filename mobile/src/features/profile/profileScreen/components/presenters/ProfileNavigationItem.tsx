import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Text } from '@/shared/components/ui/Text';

interface ProfileNavigationItemProps {
	title: string;
	subtitle: string;
	icon: keyof typeof Ionicons.glyphMap;
	onPress: () => void;
	/** Wide screens: a tighter card, so the whole profile fits the window. */
	compact?: boolean;
}

export function ProfileNavigationItem({
	title,
	subtitle,
	icon,
	onPress,
	compact = false,
}: ProfileNavigationItemProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.buttonContainer}>
			<Pressable
				style={[styles.menuButton, compact && styles.compact]}
				onPress={onPress}
				accessibilityLabel={title}
			>
				<View style={styles.iconContainer}>
					<Ionicons name={icon} size={20} color={theme.colors.primary} />
				</View>
				<View style={styles.textContainer}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.subtitle}>{subtitle}</Text>
				</View>
				<Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
			</Pressable>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		buttonContainer: {
			paddingHorizontal: theme.spacing.lg,
			marginTop: theme.spacing.md,
		},
		menuButton: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.lg,
			borderRadius: 16,
		},
		compact: {
			paddingVertical: theme.spacing.sm + theme.spacing.xs,
			paddingHorizontal: theme.spacing.md,
		},
		iconContainer: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: theme.colors.primary + '15',
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
		},
		textContainer: {
			flex: 1,
		},
		title: {
			fontSize: 16,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		subtitle: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
	});
