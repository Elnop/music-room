import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import type { Theme } from '@/themes/types';
import { useSoundCloudStore } from '@store/soundcloudStore';
import { useQueueStore } from '@store/queueStore';
import { toTrackInput } from '@utils/trackInput';
import { SoundCloudTrackItem } from '@screens/search/components/SoundCloudTrackItem';
import { TrackActionsSheet } from '@components/track/TrackActionsSheet';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import debounce from 'lodash/debounce';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import type { AddQueueItemBody } from '@/types/queue.types';

export function SoundCloudSearchScreen() {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const [searchQuery, setSearchQuery] = useState('');
	const [actionTrack, setActionTrack] = useState<AddQueueItemBody | null>(null);

	const { searchResults, isSearching, error, search, clearSearch, clearError } =
		useSoundCloudStore();
	const playListTrack = useQueueStore(state => state.playListTrack);
	const addToQueue = useQueueStore(state => state.addItem);

	// Debounced search
	const debouncedSearch = useMemo(
		() =>
			debounce((query: string) => {
				search(query);
			}, 500),
		[search]
	);

	const handleSearchChange = (text: string) => {
		setSearchQuery(text);
		if (text.trim()) {
			debouncedSearch(text);
		} else {
			clearSearch();
		}
	};

	// On the phone, or on the remote device in remote mode (#297).
	const handlePlay = (track: SoundCloudTrack) => {
		void playListTrack(track);
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TextInput
					style={styles.searchInput}
					placeholder="Rechercher sur SoundCloud..."
					placeholderTextColor={theme.colors.textSecondary}
					value={searchQuery}
					onChangeText={handleSearchChange}
					autoCapitalize="none"
					autoCorrect={false}
				/>
			</View>

			{error && (
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity onPress={clearError}>
						<Text style={styles.dismissText}>Dismiss</Text>
					</TouchableOpacity>
				</View>
			)}

			{isSearching && searchResults.length === 0 ? (
				<LoadingSpinner size="large" />
			) : (
				<FlatList
					data={searchResults}
					keyExtractor={item => item.id.toString()}
					renderItem={({ item }) => (
						<SoundCloudTrackItem
							track={item}
							onPlay={handlePlay}
							onAddToQueue={track => addToQueue(toTrackInput(track))}
							onShowActions={track => setActionTrack(toTrackInput(track))}
						/>
					)}
					contentContainerStyle={{
						paddingBottom: playerHeight + theme.spacing.xxl,
						flexGrow: 1,
					}}
					ListEmptyComponent={
						searchQuery && !isSearching ? (
							<Text style={styles.emptyText}>Aucun titre trouvé</Text>
						) : !searchQuery ? (
							<View style={styles.emptyState}>
								<Ionicons
									name="musical-notes-outline"
									size={64}
									color={theme.colors.textSecondary}
									style={styles.emptyIcon}
								/>
								<Text style={styles.emptyText}>Rechercher sur SoundCloud</Text>
								<Text style={styles.emptySubtext}>
									Trouvez des titres à ajouter à vos playlists
								</Text>
							</View>
						) : null
					}
				/>
			)}

			<TrackActionsSheet track={actionTrack} onClose={() => setActionTrack(null)} />
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		header: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.xs,
			paddingBottom: theme.spacing.md,
		},
		searchInput: {
			backgroundColor: theme.colors.surfaceAlt,
			borderRadius: 8,
			paddingVertical: 12,
			paddingHorizontal: theme.spacing.md,
			fontSize: 16,
			color: theme.colors.text,
		},
		errorContainer: {
			backgroundColor: theme.colors.error + '20',
			padding: theme.spacing.md,
			marginHorizontal: theme.spacing.lg,
			borderRadius: theme.borders.small,
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: theme.spacing.sm,
		},
		errorText: {
			color: theme.colors.error,
			fontSize: 14,
			flex: 1,
		},
		dismissText: {
			color: theme.colors.error,
			fontWeight: theme.typography.weights.semibold,
			fontSize: 14,
		},
		emptyState: {
			alignItems: 'center',
			justifyContent: 'center',
			paddingTop: theme.spacing.xxl * 2,
			paddingHorizontal: theme.spacing.xl,
		},
		emptyIcon: {
			marginBottom: theme.spacing.lg,
			opacity: 0.6,
		},
		emptyText: {
			textAlign: 'center',
			color: theme.colors.textSecondary,
			fontSize: 18,
			fontWeight: theme.typography.weights.semibold,
			marginBottom: theme.spacing.sm,
		},
		emptySubtext: {
			textAlign: 'center',
			color: theme.colors.textSecondary,
			fontSize: 14,
		},
	});
