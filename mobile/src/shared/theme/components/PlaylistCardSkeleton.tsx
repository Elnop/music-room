import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import { useGridTileWidth } from '@/shared/theme/hooks/useGridTileWidth';
import { SkeletonBlock } from '@/shared/theme/components/SkeletonBlock';

interface PlaylistCardSkeletonProps {
	width?: number;
}

export function PlaylistCardSkeleton({ width: fixedWidth }: PlaylistCardSkeletonProps) {
	const { theme } = useTheme();
	const tileWidth = useGridTileWidth();
	const width = fixedWidth ?? tileWidth;
	const styles = useMemo(() => createStyles(theme), [theme]);
	return (
		<View style={{ width }}>
			<SkeletonBlock width={width} height={width} radius={8} />
			<SkeletonBlock width="80%" height={14} style={styles.cardTitle} />
			<SkeletonBlock width="50%" height={12} style={styles.secondLine} />
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		cardTitle: {
			marginTop: theme.spacing.sm,
		},
		secondLine: {
			marginTop: 6,
		},
	});
}
