import React from 'react';
import { StyleSheet } from 'react-native';
import { SearchBar } from '@/shared/theme/components/SearchBar';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { OpenPlaylistInfo } from '@/features/playlists/features/editor/features/sharing/components/presenters/OpenPlaylistInfo';
import { UserResults } from '@/features/playlists/features/editor/features/sharing/components/presenters/UserResults';
import type { PlaylistSharing } from '@/features/playlists/features/editor/features/sharing/sharingTypes';

type SharingSearchProps = {
	sharing: PlaylistSharing;
};

export function SharingSearch({ sharing }: SharingSearchProps) {
	const { styles } = useThemedStyles(createStyles);
	const { userSearch } = sharing;

	if (sharing.isInfoOnly) return <OpenPlaylistInfo />;
	return (
		<>
			<SearchBar
				value={userSearch.search.text}
				onChangeText={userSearch.search.change}
				placeholder="Rechercher un utilisateur…"
				style={styles.searchBar}
			/>
			{userSearch.search.text.trim() !== '' && (
				<UserResults
					results={userSearch.results}
					isSearching={userSearch.isSearching}
					busy={sharing.members.busy}
					onAdd={sharing.addUser}
				/>
			)}
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		searchBar: { marginBottom: theme.spacing.md },
	});
	return styles;
}
