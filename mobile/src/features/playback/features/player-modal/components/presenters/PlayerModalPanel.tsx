import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { PlayerHeader } from '@/features/playback/features/player-modal/components/presenters/PlayerHeader';
import { PlayerModalBody } from '@/features/playback/features/player-modal/components/presenters/PlayerModalBody';
import { useInsetStyles } from '@/features/playback/features/player-modal/hooks/useInsetStyles';
import { createFrameStyles } from '@/features/playback/features/player-modal/lib/createFrameStyles';
import type { PlayerModalParts } from '@/features/playback/features/player-modal/playerModalTypes';

type PlayerModalPanelProps = {
	parts: PlayerModalParts;
	dialog: boolean;
};

export function PlayerModalPanel({ parts, dialog }: PlayerModalPanelProps) {
	const { styles } = useInsetStyles(createFrameStyles);
	const { modal, gestures } = parts;

	return (
		<GestureDetector gesture={gestures.panGesture}>
			<Animated.View
				style={[
					styles.container,
					styles.modalContent,
					dialog && styles.dialog,
					gestures.animatedStyle,
				]}
			>
				<Animated.View style={[StyleSheet.absoluteFill, modal.backgroundStyle]} />
				<PlayerHeader
					colors={modal.colors}
					state={{ dialog, isLoading: modal.transport.isLoading }}
					onClose={modal.closeModal}
				/>
				<PlayerModalBody parts={parts} />
				<View style={styles.bottomSpacer} />
			</Animated.View>
		</GestureDetector>
	);
}
