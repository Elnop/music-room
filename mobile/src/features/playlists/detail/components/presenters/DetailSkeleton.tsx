import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonBlock, SkeletonList, TrackRowSkeleton } from '@/shared/components/ui/Skeleton';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createDetailStyles } from './detailStyles';

/** The playlist screen while it loads: cover, title, then track rows. */
export function DetailSkeleton() {
	const insets = useSafeAreaInsets();
	const { styles, theme } = useThemedStyles(createStyles);
	const layout = React.useMemo(() => createDetailStyles(theme, insets.top), [theme, insets.top]);

	return (
		<View style={layout.container}>
			<SkeletonList
				count={8}
				row={TrackRowSkeleton}
				style={layout.list}
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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
