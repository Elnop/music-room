import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface LoadFailureProps {
	/** Private or deleted (403, 404): no retry. */
	notFound: boolean;
	onRetry: () => void;
}

export function LoadFailure({ notFound, onRetry }: LoadFailureProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.failure}>
			{notFound ? (
				<EmptyState icon="lock" message="Playlist introuvable ou inaccessible" />
			) : (
				<>
					<EmptyState
						icon="alert"
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
			alignItems: 'center',
			justifyContent: 'center',
			padding: theme.spacing.xl,
		},
		failureMessage: {
			marginBottom: theme.spacing.lg,
		},
	});
