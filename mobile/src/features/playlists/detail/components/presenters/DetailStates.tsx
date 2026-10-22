import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Button } from '@/shared/components/ui/Button';
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

interface LoadFailureProps {
	/** Private or deleted (403, 404): no retry. */
	notFound: boolean;
	onRetry: () => void;
}

/** The playlist could not be loaded (#321). */
export function LoadFailure({ notFound, onRetry }: LoadFailureProps) {
	const { styles: styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.failure}>
			{notFound ? (
				<EmptyState icon="lock-closed-outline" message="Playlist introuvable ou inaccessible" />
			) : (
				<>
					<EmptyState
						icon="cloud-offline-outline"
						message="Impossible de charger la playlist"
						style={styles.failureMessage}
					/>
					<Button title="Réessayer" variant="outline" onPress={onRetry} />
				</>
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		failure: {
			flex: 1,
			backgroundColor: theme.colors.background,
			justifyContent: 'center',
			alignItems: 'center',
			padding: theme.spacing.xl,
		},
		failureMessage: {
			flex: 0,
		},
		header: {
			alignItems: 'center',
			paddingHorizontal: theme.spacing.md,
			marginBottom: theme.spacing.lg,
		},
		title: {
			marginTop: theme.spacing.lg,
		},
		line: {
			marginTop: theme.spacing.sm,
		},
	});
