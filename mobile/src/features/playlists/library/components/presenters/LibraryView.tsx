import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SectionHeader } from '@/shared/components/lists/SectionHeader';
import { PlaylistCardSkeleton, SkeletonList } from '@/shared/components/ui/Skeleton';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { LibraryScreen } from '@/features/playlists/library/hooks/useLibraryScreen';
import type { Playlist } from '@/features/playlists/types';
import { createListStyles } from '@/features/playlists/home/components/presenters/listStyles';
import { PlaylistGrid } from '@/features/playlists/home/components/presenters/PlaylistGrid';
import { RefreshableScroll } from '@/features/playlists/home/components/presenters/RefreshableScroll';

interface LibraryViewProps {
	screen: LibraryScreen;
	actionsFor?: (playlist: Playlist) => (() => void) | undefined;
}

export function LibraryView({ screen, actionsFor }: LibraryViewProps) {
	const { styles } = useThemedStyles(createListStyles);

	if (screen.isInitialLoading) {
		return (
			<View style={styles.container}>
				<SkeletonList count={4} row={PlaylistCardSkeleton} style={[styles.list, styles.grid]} />
			</View>
		);
	}

	return (
		<RefreshableScroll
			isRefreshing={screen.isRefreshing}
			onRefresh={screen.refresh}
			bottomPadding={screen.bottomPadding}
		>
			<View style={styles.section}>
				<SectionHeader icon="library-outline" title="Vos playlists" count={screen.owned.length} />
				{screen.owned.length > 0 ? (
					<PlaylistGrid
						playlists={screen.owned}
						onOpen={screen.openPlaylist}
						actionsFor={actionsFor}
					/>
				) : (
					<EmptyState
						icon="musical-notes-outline"
						message="Aucune playlist pour l'instant. Créez votre première playlist !"
						action={{ label: 'Créer une playlist', onPress: screen.createPlaylist }}
					/>
				)}
			</View>
			{screen.shared.length > 0 && (
				<>
					<View style={styles.sectionSpacer} />
					<View style={styles.section}>
						<SectionHeader
							icon="share-social-outline"
							title="Partagées avec vous"
							count={screen.shared.length}
						/>
						<PlaylistGrid playlists={screen.shared} onOpen={screen.openPlaylist} />
					</View>
				</>
			)}
		</RefreshableScroll>
	);
}
