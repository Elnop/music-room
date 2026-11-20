import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { Button } from '@/shared/theme/components/Button';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';

interface LoadFailureProps {
	/** 403 or 404: no retry. */
	notFound: boolean;
	onRetry: () => void;
}

export function LoadFailure({ notFound, onRetry }: LoadFailureProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.failure}>
			{notFound ? (
				<EmptyState icon={LockSolid} message="Playlist introuvable ou inaccessible" />
			) : (
				<>
					<EmptyState
						icon={ExclamationTriangleSolid}
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
