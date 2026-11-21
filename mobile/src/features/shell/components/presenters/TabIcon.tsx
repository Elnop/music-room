import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import { useTheme } from '@/shared/theme/hooks/useTheme';
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

function TabIcon({ routeName, focused, color }: TabIconProps) {
	const { theme } = useTheme();
	return (
		<View style={[styles.icon, { gap: theme.spacing.xs }]}>
			<PixelIcon icon={TAB_ICONS[routeName]} color={color} />
			<View style={[styles.dot, focused && { backgroundColor: color }]} />
		</View>
	);
}

export function tabIconFor(routeName: string) {
	return ({ focused, color }: { focused: boolean; color: string }) => (
		<TabIcon routeName={routeName} focused={focused} color={color} />
	);
}

const styles = StyleSheet.create({
	icon: { alignItems: 'center' },
	dot: { width: 6, height: 6 },
});
