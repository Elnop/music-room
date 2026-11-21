import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProfileNavigationIcon } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileNavigationIcon';
import { ProfileNavigationText } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileNavigationText';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { keycap } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
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
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.buttonContainer}>
			<Pressable style={styles.menuButton} onPress={onPress} accessibilityLabel={title}>
				<ProfileNavigationIcon icon={icon} />
				<ProfileNavigationText title={title} subtitle={subtitle} />
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
	});
	return styles;
}
