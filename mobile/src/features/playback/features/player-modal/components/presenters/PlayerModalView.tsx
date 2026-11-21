import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { PlayerHeader } from '@/features/playback/features/player-modal/components/presenters/PlayerHeader';
import { isPlayerDialog } from '@/features/playback/features/player-modal/components/presenters/playerModalStyles';
import { PlayerTrackError } from '@/features/playback/features/player-modal/components/presenters/PlayerTrackError';
import { PlayerArtworkCarousel } from '@/features/playback/features/player-modal/components/presenters/PlayerArtworkCarousel';
import { PlayerProgressSlider } from '@/features/playback/shared/seek-bar/PlayerProgressSlider';
import { PlayerControls } from '@/features/playback/features/player-modal/components/presenters/PlayerControls';
import { PlayerBottomBar } from '@/features/playback/features/player-modal/components/presenters/PlayerBottomBar';
import type { usePlayerModal } from '@/features/playback/features/player-modal/hooks/usePlayerModal';
import type { usePlayerModalGestures } from '@/features/playback/features/player-modal/hooks/usePlayerModalGestures';
import type { SeekPosition } from '@/features/playback/shared/seek-bar/useSeekPosition';
import type { ArtworkCarousel } from '@/features/playback/features/player-modal/hooks/useArtworkCarousel';

type PlayerModalViewProps = PlayerSheets & {
	modal: ReturnType<typeof usePlayerModal>;
	gestures: ReturnType<typeof usePlayerModalGestures>;
	seek: SeekPosition;
	carousel: ArtworkCarousel;
};

export function PlayerModalView({
	modal,
	gestures,
	seek,
	carousel,
	QueueModal,
	DevicePicker,
}: PlayerModalViewProps) {
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
						<Animated.View style={[StyleSheet.absoluteFill, modal.backgroundStyle]} />

						<PlayerHeader
							styles={modal.styles}
							colors={modal.colors}
							dialog={dialog}
							isLoading={modal.isLoading}
							onClose={modal.closeModal}
						/>

						<View style={modal.styles.mainContent}>
							<GestureDetector gesture={carousel.panGesture}>
								<View>
									<PlayerArtworkCarousel
										styles={modal.styles}
										carousel={carousel}
										colors={modal.colors}
									/>
								</View>
							</GestureDetector>

							<PlayerTrackError
								styles={modal.styles}
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

				<QueueModal
					visible={modal.isModalOpen && !isDesktop && modal.isQueueOpen}
					onClose={() => modal.setQueueOpen(false)}
				/>
				<DevicePicker
					visible={modal.isModalOpen && !isDesktop && modal.isDevicesOpen}
					onClose={() => modal.setDevicesOpen(false)}
				/>
			</GestureHandlerRootView>
		</Modal>
	);
}
