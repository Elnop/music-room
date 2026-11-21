import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FullScreenSheet } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';
import { AppToast } from '@/shared/theme/components/AppToast';
import type { TrackActionsSheetComponent } from '@/shared/playback/types/trackActionsSheetTypes';
import { QueueModalHeader } from '@/features/playback/features/queue-modal/components/presenters/QueueModalHeader';
import { QueueList } from '@/features/playback/features/queue-modal/components/presenters/QueueList';
import { useQueueModalStyles } from '@/features/playback/features/queue-modal/hooks/useQueueModalStyles';
import type {
	QueueActionSheet,
	QueueListState,
	QueueRowActions,
} from '@/features/playback/features/queue-modal/queueModalTypes';

type QueueModalViewProps = {
	TrackActionsSheet: TrackActionsSheetComponent;
	visible: boolean;
	onClose: () => void;
	list: QueueListState;
	rowActions: QueueRowActions;
	actionSheet: QueueActionSheet;
};

export function QueueModalView({
	TrackActionsSheet,
	visible,
	onClose,
	list,
	rowActions,
	actionSheet,
}: QueueModalViewProps) {
	const styles = useQueueModalStyles();

	return (
		<FullScreenSheet visible={visible} onClose={onClose}>
			<GestureHandlerRootView style={styles.container}>
				<QueueModalHeader onClose={onClose} />
				<QueueList list={list} rowActions={rowActions} />
				<TrackActionsSheet track={actionSheet.track} onClose={actionSheet.onClose} />
				<AppToast />
			</GestureHandlerRootView>
		</FullScreenSheet>
	);
}
