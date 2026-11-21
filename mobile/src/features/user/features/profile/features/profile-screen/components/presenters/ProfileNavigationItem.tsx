import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { keycap, pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import AngleRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/angle-right-solid.svg';

type ProfileNavigationItemProps = {
	title: string;
	subtitle: string;
	icon: PixelIconSource;
	onPress: () => void;
};

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

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
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
	return styles;
}
