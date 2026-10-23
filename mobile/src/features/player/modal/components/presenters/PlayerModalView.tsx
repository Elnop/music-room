import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { getPlayerModal } from '@/shared/services/playerModalsBridge';
import { PlayerHeader } from './PlayerHeader';
import { PlayerTrackInfo } from './PlayerTrackInfo';
import { PlayerProgressSlider } from './PlayerProgressSlider';
import { PlayerControls } from './PlayerControls';
import type { usePlayerModal } from '@/features/player/modal/hooks/usePlayerModal';
import type { usePlayerModalGestures } from '@/features/player/modal/hooks/usePlayerModalGestures';
import type { SeekPosition } from '@/features/player/modal/hooks/useSeekPosition';

interface PlayerModalViewProps {
	modal: ReturnType<typeof usePlayerModal>;
	gestures: ReturnType<typeof usePlayerModalGestures>;
	seek: SeekPosition;
}

export function PlayerModalView({ modal, gestures, seek }: PlayerModalViewProps) {
	const QueueModal = getPlayerModal('QueueModal');
	const DevicePickerSheet = getPlayerModal('DevicePickerSheet');

	return (
		<Modal
			visible={modal.isModalOpen}
			animationType="slide"
			presentationStyle="overFullScreen"
			transparent
			onRequestClose={modal.closeModal}
		>
			<GestureHandlerRootView style={modal.styles.container}>
				<GestureDetector gesture={gestures.panGesture}>
					<Animated.View
						style={[modal.styles.container, modal.styles.modalContent, gestures.animatedStyle]}
					>
						<LinearGradient
							colors={modal.gradientColors}
							style={StyleSheet.absoluteFill}
							start={{ x: 0.5, y: 0 }}
							end={{ x: 0.5, y: 1 }}
						/>

						<PlayerHeader
							styles={modal.styles}
							colors={modal.colors}
							deviceLabel={modal.deviceLabel}
							onClose={modal.closeModal}
							onOpenDevices={() => modal.setDevicesOpen(true)}
							onOpenQueue={() => modal.setQueueOpen(true)}
						/>

						<View style={modal.styles.mainContent}>
							<PlayerTrackInfo
								styles={modal.styles}
								track={modal.track}
								artworkUrl={modal.artworkUrl}
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
								hasTrack={modal.track !== null}
								canGoPrevious={modal.canGoPrevious}
								canGoNext={modal.canGoNext}
								playDisabled={modal.playDisabled}
								onPrevious={modal.handlePrevious}
								onPlayPause={modal.handlePlayPause}
								onNext={modal.handleNext}
							/>
						</View>

						<View style={modal.styles.bottomSpacer} />
					</Animated.View>
				</GestureDetector>

				{QueueModal &&
					React.createElement(QueueModal, {
						visible: modal.isModalOpen && modal.isQueueOpen,
						onClose: () => modal.setQueueOpen(false),
					})}
				{DevicePickerSheet &&
					React.createElement(DevicePickerSheet, {
						visible: modal.isModalOpen && modal.isDevicesOpen,
						onClose: () => modal.setDevicesOpen(false),
					})}
			</GestureHandlerRootView>
		</Modal>
	);
}
