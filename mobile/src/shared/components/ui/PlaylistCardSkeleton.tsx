import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { SkeletonBlock } from './SkeletonBlock';

// Same width as PlaylistGridCard, so the grid does not jump when cards arrive.
const GRID_CARD_WIDTH = (Dimensions.get('window').width - 48 - 8) / 2;

interface PlaylistCardSkeletonProps {
	width?: number;
}

/** Same shape as a playlist card: square cover, name and owner lines. */
export function PlaylistCardSkeleton({ width = GRID_CARD_WIDTH }: PlaylistCardSkeletonProps) {
	const { theme } = useTheme();
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
