import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';

interface ProfileSectionProps {
	title: string;
	children: React.ReactNode;
	rightAction?: {
		label: string;
		onPress: () => void;
	};
}

export function ProfileSection({ title, children, rightAction }: ProfileSectionProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>{title}</Text>
				{rightAction && (
					<Pressable onPress={rightAction.onPress} accessibilityLabel={rightAction.label}>
						<Text style={styles.action}>{rightAction.label}</Text>
					</Pressable>
				)}
			</View>
			<View style={styles.content}>{children}</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			backgroundColor: theme.colors.surface,
			borderRadius: 16,
			marginHorizontal: theme.spacing.lg,
			marginBottom: theme.spacing.md,
			overflow: 'hidden',
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.md,
			paddingTop: theme.spacing.md,
			paddingBottom: theme.spacing.sm,
		},
		title: {
			fontSize: 13,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.textSecondary,
			textTransform: 'uppercase',
			letterSpacing: 0.5,
		},
		action: {
			fontSize: 14,
			fontWeight: theme.typography.weights.medium,
			color: theme.colors.primary,
		},
		content: {
			paddingHorizontal: theme.spacing.md,
			paddingBottom: theme.spacing.md,
		},
	});
