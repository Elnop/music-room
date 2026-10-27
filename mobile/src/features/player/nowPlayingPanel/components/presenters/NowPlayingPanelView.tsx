import React from 'react';
import { ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { useSeparatorColor } from '@/shared/hooks/useSeparatorColor';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';
import { Artwork } from '@/shared/components/media/Artwork';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { getPlayerModal } from '@/shared/services/playerModalsBridge';
import { getTrackActionsSheet } from '@/shared/services/trackActionsBridge';
import type { Theme } from '@/shared/theme/types';
import { PANEL_CLOSE_ID, PANEL_ID } from '@/features/player/constants';
import type { NowPlayingPanelData } from '@/features/player/nowPlayingPanel/hooks/useNowPlayingPanel';
import { PanelDeviceCard } from './PanelDeviceCard';
import { PanelTrackActions } from './PanelTrackActions';
import { UpNextSection } from './UpNextSection';
import { createStyles, PANEL_ARTWORK_SIZE } from './nowPlayingPanelStyles';

interface NowPlayingPanelViewProps {
	data: NowPlayingPanelData;
}

/** Docked beside the content, above the player bar: what plays, its actions, the device and what comes next. */
export function NowPlayingPanelView({ data }: NowPlayingPanelViewProps) {
	const separator = useSeparatorColor();
	const factory = React.useCallback((theme: Theme) => createStyles(theme, separator), [separator]);
	const { styles, theme } = useThemedStyles(factory);
	const QueueModal = getPlayerModal('QueueModal');
	const DevicePickerSheet = getPlayerModal('DevicePickerSheet');
	const TrackActionsSheet = getTrackActionsSheet();
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
					<Ionicons name="close" size={22} color={theme.colors.text} />
				</Pressable>
			</View>

			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				{track ? (
					<>
						<Artwork uri={data.artworkUrl} size={PANEL_ARTWORK_SIZE} style={styles.artwork} />
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
						icon="musical-notes-outline"
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

			{QueueModal &&
				React.createElement(QueueModal, { visible: data.isQueueOpen, onClose: data.onCloseSheet })}
			{DevicePickerSheet &&
				React.createElement(DevicePickerSheet, {
					visible: data.isDevicesOpen,
					onClose: data.onCloseSheet,
				})}
			{TrackActionsSheet &&
				React.createElement(TrackActionsSheet, {
					track: data.actions?.track ?? null,
					start: data.actions?.start,
					onClose: data.onCloseActions,
				})}
		</View>
	);
}
