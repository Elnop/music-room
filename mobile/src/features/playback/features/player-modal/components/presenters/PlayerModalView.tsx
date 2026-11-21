import React from 'react';
import { Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/playerSheetsTypes';
import { PlayerDialogBackdrop } from '@/features/playback/features/player-modal/components/presenters/PlayerDialogBackdrop';
import { PlayerModalPanel } from '@/features/playback/features/player-modal/components/presenters/PlayerModalPanel';
import { PlayerModalSheets } from '@/features/playback/features/player-modal/components/presenters/PlayerModalSheets';
import { useInsetStyles } from '@/features/playback/features/player-modal/hooks/useInsetStyles';
import { usePlayerDialog } from '@/features/playback/features/player-modal/hooks/usePlayerDialog';
import { createFrameStyles } from '@/features/playback/features/player-modal/lib/createFrameStyles';
import type { PlayerModalParts } from '@/features/playback/features/player-modal/playerModalTypes';

type PlayerModalViewProps = PlayerSheets & PlayerModalParts;

export function PlayerModalView({ QueueModal, DevicePicker, ...parts }: PlayerModalViewProps) {
	const { styles } = useInsetStyles(createFrameStyles);
	const { modal } = parts;
	const { dialog, visible } = usePlayerDialog(modal.isModalOpen);

	return (
		<Modal
			visible={visible}
			animationType={dialog ? 'fade' : 'slide'}
			presentationStyle="overFullScreen"
			transparent
			onRequestClose={modal.closeModal}
		>
			<GestureHandlerRootView style={[styles.container, dialog && styles.dialogFrame]}>
				{dialog && <PlayerDialogBackdrop onClose={modal.closeModal} />}
				<PlayerModalPanel parts={parts} dialog={dialog} />
				<PlayerModalSheets
					sheets={{ QueueModal, DevicePicker }}
					state={modal.sheets}
					visible={visible}
				/>
			</GestureHandlerRootView>
		</Modal>
	);
}
