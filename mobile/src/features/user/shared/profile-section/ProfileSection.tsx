import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { pixelCaption } from '@/shared/theme/lib/pixelCaption';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

type ProfileSectionProps = {
	title: string;
	children: React.ReactNode;
	rightAction?: {
		label: string;
		onPress: () => void;
	};
	prominent?: boolean;
};

export function ProfileSection({
	title,
	children,
	rightAction,
	prominent = false,
}: ProfileSectionProps) {
	const { styles } = useThemedStyles(createStyles);
	const { styles: headerStyles } = useThemedStyles(createHeaderStyles);

	return (
		<View style={styles.container}>
			<View style={headerStyles.header}>
				<Text style={prominent ? headerStyles.prominentTitle : headerStyles.title}>{title}</Text>
				{rightAction && (
					<Pressable onPress={rightAction.onPress} accessibilityLabel={rightAction.label}>
						<Text style={headerStyles.action}>{rightAction.label}</Text>
					</Pressable>
				)}
			</View>
			<View style={styles.content}>{children}</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			...pixelFrame(theme),
			backgroundColor: theme.colors.surface,
			marginHorizontal: theme.spacing.lg,
			marginBottom: theme.spacing.md,
			overflow: 'hidden',
		},
		content: {
			paddingHorizontal: theme.spacing.md,
			paddingBottom: theme.spacing.md,
		},
	});
	return styles;
}

function createHeaderStyles(theme: Theme) {
	const headerStyles = StyleSheet.create({
		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.md,
			paddingTop: theme.spacing.md,
			paddingBottom: theme.spacing.sm,
		},
		title: pixelCaption(theme),
		prominentTitle: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		action: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.primary,
		},
	});
	return headerStyles;
}
