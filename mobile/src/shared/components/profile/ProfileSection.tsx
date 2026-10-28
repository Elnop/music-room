import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import { pixelCaption, pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { Text } from '@/shared/components/ui/Text';

interface ProfileSectionProps {
	title: string;
	children: React.ReactNode;
	rightAction?: {
		label: string;
		onPress: () => void;
	};
	/** Wide screens: a larger title, read as the heading of the page's section. */
	prominent?: boolean;
}

export function ProfileSection({
	title,
	children,
	rightAction,
	prominent = false,
}: ProfileSectionProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={prominent ? styles.prominentTitle : styles.title}>{title}</Text>
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
			...pixelFrame(theme),
			backgroundColor: theme.colors.surface,
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
			...pixelCaption(theme),
		},
		prominentTitle: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		action: {
			fontSize: 14,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.primary,
		},
		content: {
			paddingHorizontal: theme.spacing.md,
			paddingBottom: theme.spacing.md,
		},
	});
