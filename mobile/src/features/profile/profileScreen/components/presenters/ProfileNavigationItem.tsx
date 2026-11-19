import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import type { PixelIconSource } from '@/shared/components/media/PixelIcon';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import { keycap, pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { Text } from '@/shared/components/ui/Text';
import AngleRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/angle-right-solid.svg';

interface ProfileNavigationItemProps {
	title: string;
	subtitle: string;
	icon: PixelIconSource;
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
					<PixelIcon icon={icon} size={20} color={theme.colors.primary} />
				</View>
				<View style={styles.textContainer}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.subtitle}>{subtitle}</Text>
				</View>
				<PixelIcon icon={AngleRightSolid} size={20} color={theme.colors.textSecondary} />
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
