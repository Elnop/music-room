import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Avatar } from '@/shared/components/media/Avatar';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { UserSummary } from '@/features/playlists/types';
import { createSharingStyles } from './sharingStyles';

interface UserResultsProps {
	results: UserSummary[];
	isSearching: boolean;
	/** A member change is on its way: adding waits. */
	busy: boolean;
	onAdd: (user: UserSummary) => void;
}

/** The users found by the search, each added with one tap. */
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
								<Text style={styles.username}>{item.username}</Text>
								{item.displayName && <Text style={styles.displayName}>{item.displayName}</Text>}
							</View>
							<View style={styles.addButton}>
								<Ionicons name="add" size={24} color={theme.colors.onColor} />
							</View>
						</Pressable>
					)}
				/>
			) : (
				<EmptyState icon="search-outline" style={styles.empty} message="Aucun utilisateur trouvé" />
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
		username: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
		displayName: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		addButton: {
			width: 36,
			height: 36,
			borderRadius: 18,
			backgroundColor: theme.colors.primary,
			alignItems: 'center',
			justifyContent: 'center',
		},
	});
