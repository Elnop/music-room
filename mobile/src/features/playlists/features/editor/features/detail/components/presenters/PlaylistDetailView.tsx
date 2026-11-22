import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { CoverBand } from '@/features/playlists/features/editor/features/detail/components/presenters/CoverBand';
import { DetailListHeader } from '@/features/playlists/features/editor/features/detail/components/presenters/DetailListHeader';
import { DetailTrackList } from '@/features/playlists/features/editor/features/detail/components/presenters/DetailTrackList';
import { createDetailStyles } from '@/features/playlists/features/editor/features/detail/lib/createDetailStyles';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import type { DetailPage } from '@/features/playlists/features/editor/features/detail/types/detailPageTypes';

type PlaylistDetailViewProps = {
	page: DetailPage;
	playlist: PlaylistWithTracks;
	header: React.ReactElement;
};

export function PlaylistDetailView({ page, playlist, header }: PlaylistDetailViewProps) {
	const { theme } = useTheme();
	const top = useSafeAreaInsets().top;
	const bottom = page.screen.bottomPadding;
	const styles = React.useMemo(
		() => createDetailStyles(theme, { top, bottom }),
		[theme, top, bottom],
	);
	const { isWide } = useBreakpoint();

	return (
		<View style={styles.container}>
			<CoverBand color={page.gradient[0]} />
			<DetailTrackList
				page={page}
				playlist={playlist}
				frame={{
					header: <DetailListHeader header={header} table={isWide && playlist.tracks.length > 0} />,
					contentStyle: [styles.list, isWide && styles.column],
				}}
			/>
		</View>
	);
}
