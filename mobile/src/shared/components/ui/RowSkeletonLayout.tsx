import React, { useMemo } from 'react';
import { View, type DimensionValue } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SkeletonBlock } from './SkeletonBlock';
import { createRowSkeletonStyles } from './skeletonStyles';

interface RowSkeletonLayoutProps {
	radius: number;
	firstWidth: DimensionValue;
	secondWidth: DimensionValue;
}

export function RowSkeletonLayout({ radius, firstWidth, secondWidth }: RowSkeletonLayoutProps) {
	const { theme } = useTheme();
	const styles = useMemo(() => createRowSkeletonStyles(theme), [theme]);
	return (
		<View style={styles.row}>
			<SkeletonBlock width={48} height={48} radius={radius} />
			<View style={styles.rowInfo}>
				<SkeletonBlock width={firstWidth} height={14} />
				<SkeletonBlock width={secondWidth} height={12} style={styles.secondLine} />
			</View>
		</View>
	);
}
