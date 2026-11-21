import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from './ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import { useGridTileWidth } from '@/shared/theme/hooks/useGridTileWidth';
import { SkeletonBlock } from './SkeletonBlock';

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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		cardTitle: {
			marginTop: theme.spacing.sm,
		},
		secondLine: {
			marginTop: 6,
		},
	});
