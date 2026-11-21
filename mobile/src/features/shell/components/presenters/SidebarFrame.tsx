import React from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { PixelWordmark } from '@/shared/theme/components/PixelWordmark';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type SidebarFrameProps = {
	width: number;
	topInset: number;
	isDesktop: boolean;
	children: ReactNode;
};

export function SidebarFrame({ width, topInset, isDesktop, children }: SidebarFrameProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={[styles.sidebar, placementStyle(width, topInset + theme.spacing.md)]}>
			<View style={styles.brand}>
				<PixelWordmark size={isDesktop ? 24 : 12} />
			</View>
			{children}
		</View>
	);
}

function placementStyle(width: number, paddingTop: number): ViewStyle {
	return { width, paddingTop };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		sidebar: {
			borderRightWidth: theme.borders.thick,
			backgroundColor: theme.colors.background,
			borderRightColor: theme.colors.border,
		},
		brand: { alignItems: 'center', paddingVertical: theme.spacing.smd },
	});
	return styles;
}
