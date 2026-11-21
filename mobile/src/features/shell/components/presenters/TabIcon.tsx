import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import CassetteTapeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/cassette-tape-solid.svg';
import HomeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/home-solid.svg';
import SearchSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/search-solid.svg';
import UserSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/user-solid.svg';
import UsersSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/users-solid.svg';

const TAB_ICONS: Record<string, PixelIconSource> = {
	HomeTab: HomeSolid,
	PlaylistsTab: CassetteTapeSolid,
	SearchTab: SearchSolid,
	FriendsTab: UsersSolid,
	ProfileTab: UserSolid,
};

type TabIconProps = {
	routeName: string;
	focused: boolean;
	color: string;
};

export function TabIcon({ routeName, focused, color }: TabIconProps) {
	const { styles } = useThemedStyles(createStyles);
	return (
		<View style={styles.icon}>
			<PixelIcon icon={TAB_ICONS[routeName]} color={color} />
			<View style={[styles.dot, focused && backgroundStyle(color)]} />
		</View>
	);
}

function backgroundStyle(color: string): ViewStyle {
	return { backgroundColor: color };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		icon: { alignItems: 'center', gap: theme.spacing.xs },
		dot: { width: theme.spacing.xsm, height: theme.spacing.xsm },
	});
	return styles;
}
