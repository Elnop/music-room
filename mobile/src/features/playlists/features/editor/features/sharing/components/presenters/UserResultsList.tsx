import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { UserSummary } from '@/features/playlists/shared/playlist/playlistTypes';
import { UserResultRow } from '@/features/playlists/features/editor/features/sharing/components/presenters/UserResultRow';
import SearchSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/search-solid.svg';

type UserResultsListProps = {
	results: UserSummary[];
	busy: boolean;
	onAdd: (user: UserSummary) => void;
};

export function UserResultsList({ results, busy, onAdd }: UserResultsListProps) {
	const { styles } = useThemedStyles(createStyles);

	if (results.length === 0) {
		return (
			<EmptyState icon={SearchSolid} style={styles.empty} message="Aucun utilisateur trouvé" />
		);
	}
	return (
		<FlatList
			data={results}
			keyExtractor={item => item.id}
			style={styles.list}
			scrollEnabled={false}
			renderItem={({ item }) => <UserResultRow user={item} busy={busy} onAdd={onAdd} />}
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		list: {
			maxHeight: theme.controls.resultsList,
		},
		empty: {
			flex: 0,
			padding: theme.spacing.md,
		},
	});
	return styles;
}
