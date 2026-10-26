import React from 'react';
import { View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '@/shared/theme/ThemeContext';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Artwork } from '@/shared/components/media/Artwork';
import { getPlayerModal } from '@/shared/services/playerModalsBridge';
import { PlayerProgressSlider } from '@/features/player/modal/components/presenters/PlayerProgressSlider';
import type { PlayerBarData } from '@/features/player/playerBar/hooks/usePlayerBar';
import { PlayerBarButton } from './PlayerBarButton';
import { createStyles } from './playerBarStyles';
import { Text } from '@/shared/components/ui/Text';

interface PlayerBarViewProps {
	data: PlayerBarData;
}

/** The desktop player: track, transport and seek, then the queue, devices and volume, on one row. */
export function PlayerBarView({ data }: PlayerBarViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const QueueModal = getPlayerModal('QueueModal');
	const DevicePickerSheet = getPlayerModal('DevicePickerSheet');
	const { track } = data;
	const sliderColors = {
		slider: theme.colors.primary,
		sliderBg: theme.colors.borderLight,
		textSecondary: theme.colors.textSecondary,
	};

	return (
		<View style={styles.container}>
			<View style={styles.side}>
				<Pressable
					style={styles.trackButton}
					onPress={data.onOpenPlayer}
					accessibilityLabel={data.openLabel}
				>
					<Artwork uri={track?.artworkUrl} size={56} style={styles.artwork} iconSize={24} />
					<View style={styles.info}>
						<Text style={styles.title} numberOfLines={1}>
							{track ? track.title : 'Rien en lecture'}
						</Text>
						<Text style={styles.artist} numberOfLines={1}>
							{track ? track.artist : 'Choisissez un titre pour commencer'}
						</Text>
						{data.deviceLabel && (
							<Text style={styles.device} numberOfLines={1}>
								Sur {data.deviceLabel}
							</Text>
						)}
					</View>
				</Pressable>
			</View>

			<View style={styles.center}>
				<View style={styles.controls}>
					<PlayerBarButton
						icon="play-skip-back"
						label="Piste précédente"
						onPress={data.handlePrevious}
						disabled={!data.canGoPrevious}
						color={theme.colors.text}
						style={styles.iconButton}
					/>
					<PlayerBarButton
						icon={data.isPlaying ? 'pause' : 'play'}
						label={data.isPlaying ? 'Pause' : 'Lecture'}
						onPress={data.handlePlayPause}
						disabled={data.playDisabled}
						busy={data.isLoading}
						color={track ? theme.colors.onColor : theme.colors.textSecondary}
						style={[styles.playButton, !track && styles.playButtonEmpty]}
					/>
					<PlayerBarButton
						icon="play-skip-forward"
						label="Piste suivante"
						onPress={data.handleNext}
						disabled={!data.canGoNext}
						color={theme.colors.text}
						style={styles.iconButton}
					/>
				</View>
				<View style={styles.progressSlot}>
					<PlayerProgressSlider
						styles={styles}
						colors={sliderColors}
						seek={data.seek}
						duration={data.duration}
						hasTrack={track !== null}
						disabled={data.sliderDisabled}
						onSliderAction={data.handleSliderAction}
					/>
				</View>
			</View>

			<View style={[styles.side, styles.sideEnd]}>
				<PlayerBarButton
					icon="list"
					label="File d'attente"
					onPress={data.onOpenQueue}
					color={theme.colors.text}
					style={styles.iconButton}
				/>
				<PlayerBarButton
					icon="phone-portrait-outline"
					label="Choisir l'appareil"
					onPress={data.onOpenDevices}
					selected={data.isRemote}
					color={data.isRemote ? theme.colors.primary : theme.colors.text}
					style={styles.iconButton}
				/>
				<PlayerBarButton
					icon={data.volume === 0 ? 'volume-mute' : 'volume-high'}
					label={data.volume === 0 ? 'Activer le son' : 'Couper le son'}
					onPress={data.onToggleMute}
					disabled={data.volumeDisabled}
					color={theme.colors.text}
					style={styles.iconButton}
				/>
				<Slider
					style={styles.volumeSlider}
					minimumValue={0}
					maximumValue={1}
					value={data.volume}
					onValueChange={data.onVolumeChange}
					disabled={data.volumeDisabled}
					minimumTrackTintColor={theme.colors.text}
					maximumTrackTintColor={theme.colors.borderLight}
					thumbTintColor={theme.colors.text}
					accessibilityLabel="Volume"
				/>
			</View>

			{QueueModal &&
				React.createElement(QueueModal, { visible: data.isQueueOpen, onClose: data.onCloseQueue })}
			{DevicePickerSheet &&
				React.createElement(DevicePickerSheet, {
					visible: data.isDevicesOpen,
					onClose: data.onCloseDevices,
				})}
		</View>
	);
}
