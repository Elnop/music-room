import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBlock } from '@/shared/theme/components/Skeleton';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { friendRowLayout } from '@/features/playback/features/control-delegation/features/my-devices/lib/friendRowLayout';
import type { Theme } from '@/shared/theme/types/themeTypes';

function createStyles(theme: Theme) {
	const styles = StyleSheet.create(friendRowLayout(theme));
	return styles;
}

export function DeviceCardSkeletonRow() {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.friendRow}>
			<SkeletonBlock width={32} height={32} radius={16} />
			<View style={styles.textContainer}>
				<SkeletonBlock width="45%" height={14} />
			</View>
			<SkeletonBlock width={51} height={31} radius={16} />
		</View>
	);
}
