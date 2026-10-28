import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import type { PixelSpriteName } from '@/shared/constants/pixelSprites';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import { keycap, pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { Text } from '@/shared/components/ui/Text';

interface ProfileNavigationItemProps {
	title: string;
	subtitle: string;
	icon: PixelSpriteName;
	onPress: () => void;
}

export function ProfileNavigationItem({
	title,
	subtitle,
	icon,
	onPress,
}: ProfileNavigationItemProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.buttonContainer}>
			<Pressable style={styles.menuButton} onPress={onPress} accessibilityLabel={title}>
				<View style={styles.iconContainer}>
					<PixelIcon name={icon} size={20} color={theme.colors.primary} />
				</View>
				<View style={styles.textContainer}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.subtitle}>{subtitle}</Text>
				</View>
				<PixelIcon name="right" size={20} color={theme.colors.textSecondary} />
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
			...keycap(theme),
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surfaceAlt,
			padding: theme.spacing.md,
		},
		iconContainer: {
			width: 40,
			height: 40,
			...pixelFrame(theme),
			backgroundColor: theme.colors.background,
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
