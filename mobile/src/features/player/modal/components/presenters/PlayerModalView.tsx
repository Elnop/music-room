import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { getPlayerModal } from '@/shared/services/playerModalsBridge';
import { EqualizerBars } from '@/shared/components/media/EqualizerBars';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { PlayerHeader } from './PlayerHeader';
import { isPlayerDialog } from './playerModalStyles';
import { PlayerTrackInfo } from './PlayerTrackInfo';
import { PlayerArtworkCarousel } from './PlayerArtworkCarousel';
import { PlayerProgressSlider } from './PlayerProgressSlider';
import { PlayerControls } from './PlayerControls';
import { PlayerBottomBar } from './PlayerBottomBar';
import type { usePlayerModal } from '@/features/player/modal/hooks/usePlayerModal';
import type { usePlayerModalGestures } from '@/features/player/modal/hooks/usePlayerModalGestures';
import type { SeekPosition } from '@/features/player/modal/hooks/useSeekPosition';
import type { ArtworkCarousel } from '@/features/player/modal/hooks/useArtworkCarousel';

interface PlayerModalViewProps {
	modal: ReturnType<typeof usePlayerModal>;
	gestures: ReturnType<typeof usePlayerModalGestures>;
	seek: SeekPosition;
	carousel: ArtworkCarousel;
}

export function PlayerModalView({ modal, gestures, seek, carousel }: PlayerModalViewProps) {
	const QueueModal = getPlayerModal('QueueModal');
	const DevicePickerSheet = getPlayerModal('DevicePickerSheet');
	// Desktop has the now playing panel instead; a tablet browser centres the player over the app.
	const { isDesktop, width } = useBreakpoint();
	const dialog = isPlayerDialog(width);

	return (
		<Modal
			visible={modal.isModalOpen && !isDesktop}
			animationType={dialog ? 'fade' : 'slide'}
			presentationStyle="overFullScreen"
			transparent
			onRequestClose={modal.closeModal}
		>
			<GestureHandlerRootView style={[modal.styles.container, dialog && modal.styles.dialogFrame]}>
				{dialog && (
					<Pressable
						style={modal.styles.dialogBackdrop}
						onPress={modal.closeModal}
						accessibilityRole="none"
						accessibilityLabel="Fermer le lecteur"
					/>
				)}
				<GestureDetector gesture={gestures.panGesture}>
					<Animated.View
						style={[
							modal.styles.container,
							modal.styles.modalContent,
							dialog && modal.styles.dialog,
							gestures.animatedStyle,
						]}
					>
						<View style={[StyleSheet.absoluteFill, { backgroundColor: modal.gradientColors[0] }]} />

						<PlayerHeader
							styles={modal.styles}
							colors={modal.colors}
							dialog={dialog}
							onClose={modal.closeModal}
						/>

						<View style={modal.styles.mainContent}>
							<GestureDetector gesture={carousel.panGesture}>
								<View>
									<PlayerArtworkCarousel
										styles={modal.styles}
										carousel={carousel}
										hasTrack={modal.track !== null}
										artworkUrl={modal.artworkUrl}
										emptyIconColor={modal.colors.textSecondary}
									/>
								</View>
							</GestureDetector>

							<View style={modal.styles.equalizer}>
								<EqualizerBars
									color={modal.colors.slider}
									bars={18}
									barWidth={12}
									height={42}
									playing={modal.isPlaying}
								/>
							</View>

							<PlayerTrackInfo
								styles={modal.styles}
								track={modal.track}
								infoStyle={carousel.infoStyle}
								error={modal.error}
								isRemote={modal.isRemote}
								colors={modal.colors}
							/>

							<GestureDetector gesture={gestures.sliderGesture}>
								<View>
									<PlayerProgressSlider
										styles={modal.styles}
										colors={modal.colors}
										seek={seek}
										duration={modal.duration}
										hasTrack={modal.track !== null}
										disabled={modal.sliderDisabled}
										onSliderAction={modal.handleSliderAction}
									/>
								</View>
							</GestureDetector>

							<PlayerControls
								styles={modal.styles}
								colors={modal.colors}
								isPlaying={modal.isPlaying}
								isLoading={modal.isLoading}
								canGoPrevious={modal.canGoPrevious}
								canGoNext={modal.canGoNext}
								playDisabled={modal.playDisabled}
								onPrevious={modal.handlePrevious}
								onPlayPause={modal.handlePlayPause}
								onNext={modal.handleNext}
							/>

							<PlayerBottomBar
								styles={modal.styles}
								deviceLabel={modal.deviceLabel}
								onOpenDevices={() => modal.setDevicesOpen(true)}
								onOpenQueue={() => modal.setQueueOpen(true)}
							/>
						</View>

						<View style={modal.styles.bottomSpacer} />
					</Animated.View>
				</GestureDetector>

				{QueueModal &&
					React.createElement(QueueModal, {
						visible: modal.isModalOpen && !isDesktop && modal.isQueueOpen,
						onClose: () => modal.setQueueOpen(false),
					})}
				{DevicePickerSheet &&
					React.createElement(DevicePickerSheet, {
						visible: modal.isModalOpen && !isDesktop && modal.isDevicesOpen,
						onClose: () => modal.setDevicesOpen(false),
					})}
			</GestureHandlerRootView>
		</Modal>
	);
}
