import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { Avatar } from '@/shared/theme/components/Avatar';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import { Pressable } from '@/shared/theme/components/Pressable';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { UserSummary } from '@/features/playlists/shared/playlist/lib/types';
import { createSharingStyles } from '@/features/playlists/features/editor/features/sharing/components/presenters/sharingStyles';
import { Text } from '@/shared/theme/components/Text';
import { UserNameLines } from '@/shared/theme/components/UserNameLines';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';
import SearchSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/search-solid.svg';

type UserResultsProps = {
	results: UserSummary[];
	isSearching: boolean;
	busy: boolean;
	onAdd: (user: UserSummary) => void;
};

export function UserResults({ results, isSearching, busy, onAdd }: UserResultsProps) {
	const { styles: shared } = useThemedStyles(createSharingStyles);
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.container}>
			<Text style={shared.sectionTitle}>Résultats</Text>
			{isSearching ? (
				<LoadingSpinner size="small" />
			) : results.length > 0 ? (
				<FlatList
					data={results}
					keyExtractor={item => item.id}
					style={styles.list}
					scrollEnabled={false}
					renderItem={({ item }) => (
						<Pressable
							style={[shared.card, shared.row]}
							onPress={() => onAdd(item)}
							disabled={busy}
							accessibilityLabel={`Ajouter ${item.username}`}
						>
							<Avatar size="md" name={item.displayName || item.username} uri={item.avatarUrl} />
							<View style={styles.info}>
								<UserNameLines username={item.username} displayName={item.displayName} />
							</View>
							<View style={styles.addButton}>
								<PixelIcon icon={PlusSolid} size={24} color={theme.colors.onColor} />
							</View>
						</Pressable>
					)}
				/>
			) : (
				<EmptyState icon={SearchSolid} style={styles.empty} message="Aucun utilisateur trouvé" />
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			marginBottom: theme.spacing.lg,
		},
		list: {
			maxHeight: 200,
		},
		empty: {
			flex: 0,
			padding: theme.spacing.md,
		},
		info: {
			flex: 1,
			marginLeft: theme.spacing.md,
		},
		addButton: {
			width: 36,
			height: 36,
			backgroundColor: theme.colors.primary,
			alignItems: 'center',
			justifyContent: 'center',
		},
	});
	return styles;
}
