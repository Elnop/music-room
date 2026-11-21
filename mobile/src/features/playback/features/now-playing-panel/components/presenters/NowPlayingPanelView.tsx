import React from 'react';
import { ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { useSeparatorColor } from '@/shared/theme/hooks/useSeparatorColor';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { Artwork } from '@/shared/theme/components/Artwork';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';
import type { TrackActionsSheetComponent } from '@/shared/playback/types/trackActionsSheetTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PANEL_CLOSE_ID, PANEL_ID } from '@/features/playback/shared/player/lib/constants';
import type { NowPlayingPanelData } from '@/features/playback/features/now-playing-panel/hooks/useNowPlayingPanel';
import { PanelDeviceCard } from '@/features/playback/features/now-playing-panel/components/presenters/PanelDeviceCard';
import { PanelTrackActions } from '@/features/playback/features/now-playing-panel/components/presenters/PanelTrackActions';
import { UpNextSection } from '@/features/playback/features/now-playing-panel/components/presenters/UpNextSection';
import {
	createStyles,
	PANEL_ARTWORK_SIZE,
} from '@/features/playback/features/now-playing-panel/components/presenters/nowPlayingPanelStyles';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';
import TimesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/times-solid.svg';

type NowPlayingPanelViewProps = PlayerSheets & {
	TrackActionsSheet: TrackActionsSheetComponent;
	data: NowPlayingPanelData;
};

export function NowPlayingPanelView({
	data,
	QueueModal,
	DevicePicker,
	TrackActionsSheet,
}: NowPlayingPanelViewProps) {
	const separator = useSeparatorColor();
	const factory = React.useCallback((theme: Theme) => createStyles(theme, separator), [separator]);
	const { styles, theme } = useThemedStyles(factory);
	const { track } = data;

	return (
		<View style={styles.panel} nativeID={PANEL_ID} accessibilityLabel="En cours de lecture">
			<LinearGradient colors={data.gradient} style={styles.gradient} pointerEvents="none" />
			<View style={styles.header}>
				<Text style={styles.heading} accessibilityRole="header">
					En cours de lecture
				</Text>
				<Pressable
					style={styles.iconButton}
					onPress={data.onClose}
					nativeID={PANEL_CLOSE_ID}
					accessibilityLabel="Fermer le panneau"
				>
					<PixelIcon icon={TimesSolid} size={22} color={theme.colors.text} />
				</Pressable>
			</View>

			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				{track ? (
					<>
						<Artwork uri={data.artworkUrl} size={PANEL_ARTWORK_SIZE} />
						<View style={styles.titleBlock}>
							<Text style={styles.title} numberOfLines={2}>
								{track.title}
							</Text>
							<Text style={styles.artist} numberOfLines={1}>
								{track.artist}
							</Text>
						</View>
						{data.shareUrl && (
							<PanelTrackActions
								title={track.title}
								shareUrl={data.shareUrl}
								styles={styles}
								onAddToPlaylist={data.onAddToPlaylist}
								onMoreActions={data.onMoreActions}
							/>
						)}
					</>
				) : (
					<EmptyState
						compact
						icon={MusicSolid}
						message="Rien en lecture : choisissez un titre pour commencer"
					/>
				)}

				<PanelDeviceCard
					deviceLabel={data.deviceLabel}
					isRemote={data.isRemote}
					styles={styles}
					onOpenDevices={data.onOpenDevices}
				/>
				{track && (
					<UpNextSection
						items={data.upNext}
						total={data.upNextTotal}
						styles={styles}
						onPlay={data.onPlayItem}
						onOpenQueue={data.onOpenQueue}
					/>
				)}
			</ScrollView>

			<QueueModal visible={data.isQueueOpen} onClose={data.onCloseSheet} />
			<DevicePicker visible={data.isDevicesOpen} onClose={data.onCloseSheet} />
			<TrackActionsSheet
				track={data.actions?.track ?? null}
				start={data.actions?.start}
				onClose={data.onCloseActions}
			/>
		</View>
	);
}
