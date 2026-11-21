import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonBlock, SkeletonList, TrackRowSkeleton } from '@/shared/theme/components/Skeleton';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { createDetailStyles } from '@/features/playlists/features/editor/features/detail/lib/createDetailStyles';

export function DetailSkeleton() {
	const insets = useSafeAreaInsets();
	const { styles, theme } = useThemedStyles(createStyles);
	const layout = React.useMemo(
		() => createDetailStyles(theme, { top: insets.top, bottom: theme.spacing.xxl }),
		[theme, insets.top]
	);
	const { isWide } = useBreakpoint();

	return (
		<View style={layout.container}>
			<SkeletonList
				count={8}
				row={TrackRowSkeleton}
				style={[layout.list, isWide && layout.column]}
				header={
					<View style={styles.header}>
						<SkeletonBlock width={200} height={200} radius={8} />
						<SkeletonBlock width="60%" height={24} style={styles.title} />
						<SkeletonBlock width="40%" height={14} style={styles.line} />
					</View>
				}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		header: {
			alignItems: 'center',
			marginBottom: theme.spacing.lg,
		},
		title: {
			marginTop: theme.spacing.md,
		},
		line: {
			marginTop: theme.spacing.xs,
		},
	});
	return styles;
}
