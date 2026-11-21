import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useGridTileWidth } from '@/shared/theme/hooks/useGridTileWidth';
import { SkeletonBlock } from '@/shared/theme/components/SkeletonBlock';

type PlaylistCardSkeletonProps = {
	width?: number;
};

function widthStyle(width: number): ViewStyle {
	return { width };
}

export function PlaylistCardSkeleton({ width: fixedWidth }: PlaylistCardSkeletonProps) {
	const { theme } = useTheme();
	const tileWidth = useGridTileWidth();
	const width = fixedWidth ?? tileWidth;
	const styles = useMemo(() => createStyles(theme), [theme]);
	return (
		<View style={widthStyle(width)}>
			<SkeletonBlock width={width} height={width} radius={8} />
			<SkeletonBlock width="80%" height={14} style={styles.cardTitle} />
			<SkeletonBlock width="50%" height={12} style={styles.secondLine} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		cardTitle: {
			marginTop: theme.spacing.sm,
		},
		secondLine: {
			marginTop: theme.spacing.xsm,
		},
	});
	return styles;
}
