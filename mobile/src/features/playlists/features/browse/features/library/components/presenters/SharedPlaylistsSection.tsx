import React from 'react';
import { View } from 'react-native';
import { SectionHeader } from '@/shared/theme/components/SectionHeader';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { LibraryScreen } from '@/features/playlists/features/browse/features/library/libraryTypes';
import { createListStyles } from '@/features/playlists/features/browse/shared/playlist-grid/lib/listStyles';
import { PlaylistGrid } from '@/features/playlists/features/browse/shared/playlist-grid/components/PlaylistGrid';
import ShareSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/share-solid.svg';

type SharedPlaylistsSectionProps = {
	screen: LibraryScreen;
};

export function SharedPlaylistsSection({ screen }: SharedPlaylistsSectionProps) {
	const { styles } = useThemedStyles(createListStyles);

	if (screen.shared.length === 0) return null;
	return (
		<>
			<View style={styles.sectionSpacer} />
			<View style={styles.section}>
				<SectionHeader icon={ShareSolid} title="Partagées avec vous" count={screen.shared.length} />
				<PlaylistGrid playlists={screen.shared} onOpen={screen.openPlaylist} />
			</View>
		</>
	);
}
