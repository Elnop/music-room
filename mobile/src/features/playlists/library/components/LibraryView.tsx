import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { SectionHeader } from '@/shared/theme/components/SectionHeader';
import { PlaylistCardSkeleton, SkeletonList } from '@/shared/theme/components/Skeleton';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { useContentColumn } from '@/shared/theme/hooks/useContentColumn';
import type { LibraryScreen } from '@/features/playlists/library/useLibraryScreen';
import type { Playlist } from '@/features/playlists/types';
import { createListStyles } from '@/features/playlists/home/components/presenters/listStyles';
import { PlaylistGrid } from '@/features/playlists/home/components/presenters/PlaylistGrid';
import { RefreshableScroll } from '@/features/playlists/home/components/presenters/RefreshableScroll';
import CassetteTapeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/cassette-tape-solid.svg';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';
import ShareSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/share-solid.svg';

interface LibraryViewProps {
	screen: LibraryScreen;
	actionsFor?: (playlist: Playlist) => (() => void) | undefined;
}

export function LibraryView({ screen, actionsFor }: LibraryViewProps) {
	const { styles } = useThemedStyles(createListStyles);
	const column = useContentColumn();

	if (screen.isInitialLoading) {
		return (
			<View style={styles.container}>
				<SkeletonList
					count={4}
					row={PlaylistCardSkeleton}
					style={[styles.list, styles.grid, column]}
				/>
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
				<SectionHeader icon={CassetteTapeSolid} title="Vos playlists" count={screen.owned.length} />
				{screen.owned.length > 0 ? (
					<PlaylistGrid
						playlists={screen.owned}
						onOpen={screen.openPlaylist}
						actionsFor={actionsFor}
					/>
				) : (
					<EmptyState
						icon={MusicSolid}
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
							icon={ShareSolid}
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
