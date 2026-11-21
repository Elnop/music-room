import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { UserSummary } from '@/features/playlists/shared/playlist/playlistTypes';
import { createSharingStyles } from '@/features/playlists/features/editor/features/sharing/components/presenters/createSharingStyles';
import { UserResultsList } from '@/features/playlists/features/editor/features/sharing/components/presenters/UserResultsList';
import { Text } from '@/shared/theme/components/Text';

type UserResultsProps = {
	results: UserSummary[];
	isSearching: boolean;
	busy: boolean;
	onAdd: (user: UserSummary) => void;
};

export function UserResults({ results, isSearching, busy, onAdd }: UserResultsProps) {
	const { styles: shared } = useThemedStyles(createSharingStyles);
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.container}>
			<Text style={shared.sectionTitle}>Résultats</Text>
			{isSearching ? (
				<LoadingSpinner size="small" />
			) : (
				<UserResultsList results={results} busy={busy} onAdd={onAdd} />
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			marginBottom: theme.spacing.lg,
		},
	});
	return styles;
}
