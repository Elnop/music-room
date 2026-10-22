import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { QueueModal } from '@/components/player/QueueModal';
import { DevicePickerSheet } from '@/components/player/DevicePickerSheet';
import { PlayerHeader } from './PlayerHeader';
import { PlayerTrackInfo } from './PlayerTrackInfo';
import { PlayerProgressSlider } from './PlayerProgressSlider';
import { PlayerControls } from './PlayerControls';
import type { usePlayerModal } from '@/features/player/components/modal/hooks/usePlayerModal';
import type { usePlayerModalGestures } from '@/features/player/components/modal/hooks/usePlayerModalGestures';

interface PlayerModalViewProps {
	modal: ReturnType<typeof usePlayerModal>;
	gestures: ReturnType<typeof usePlayerModalGestures>;
}

export function PlayerModalView({ modal, gestures }: PlayerModalViewProps) {
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
					<Animated.View style={[modal.styles.container, modal.styles.modalContent, gestures.animatedStyle]}>
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

							<PlayerProgressSlider
								styles={modal.styles}
								colors={modal.colors}
								currentTime={modal.currentTime}
								duration={modal.duration}
								hasTrack={modal.track !== null}
								disabled={modal.sliderDisabled}
								onSeek={modal.handleSeek}
								onSliderAction={modal.handleSliderAction}
							/>

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

				<QueueModal
					visible={modal.isModalOpen && modal.isQueueOpen}
					onClose={() => modal.setQueueOpen(false)}
				/>
				<DevicePickerSheet
					visible={modal.isModalOpen && modal.isDevicesOpen}
					onClose={() => modal.setDevicesOpen(false)}
				/>
			</GestureHandlerRootView>
		</Modal>
	);
}
