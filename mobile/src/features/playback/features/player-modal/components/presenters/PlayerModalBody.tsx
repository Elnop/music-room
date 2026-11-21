import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { PlayerArtworkCarousel } from '@/features/playback/features/player-modal/components/presenters/PlayerArtworkCarousel';
import { PlayerTrackError } from '@/features/playback/features/player-modal/components/presenters/PlayerTrackError';
import { PlayerSeekSection } from '@/features/playback/features/player-modal/components/presenters/PlayerSeekSection';
import { PlayerControls } from '@/features/playback/features/player-modal/components/presenters/PlayerControls';
import { PlayerBottomBar } from '@/features/playback/features/player-modal/components/presenters/PlayerBottomBar';
import type { PlayerModalParts } from '@/features/playback/features/player-modal/playerModalTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type PlayerModalBodyProps = {
	parts: PlayerModalParts;
};

export function PlayerModalBody({ parts }: PlayerModalBodyProps) {
	const { styles } = useThemedStyles(createStyles);
	const { modal, carousel } = parts;

	return (
		<View style={styles.mainContent}>
			<GestureDetector gesture={carousel.panGesture}>
				<View>
					<PlayerArtworkCarousel carousel={carousel} colors={modal.colors} />
				</View>
			</GestureDetector>
			<PlayerTrackError error={modal.error} isRemote={modal.isRemote} colors={modal.colors} />
			<PlayerSeekSection parts={parts} />
			<PlayerControls state={modal.transport} actions={modal.transportActions} />
			<PlayerBottomBar
				deviceLabel={modal.deviceLabel}
				onOpenDevices={() => modal.sheets.setDevicesOpen(true)}
				onOpenQueue={() => modal.sheets.setQueueOpen(true)}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		mainContent: {
			flex: 1,
			justifyContent: 'flex-end',
			paddingBottom: theme.spacing.sm,
		},
	});
	return styles;
}
