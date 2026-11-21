import { useQueueActionSheet } from '@/features/playback/features/queue-modal/hooks/useQueueActionSheet';
import { useQueueReorder } from '@/features/playback/features/queue-modal/hooks/useQueueReorder';
import { useQueueRowActions } from '@/features/playback/features/queue-modal/hooks/useQueueRowActions';
import { useQueueSplit } from '@/features/playback/features/queue-modal/hooks/useQueueSplit';

export function useQueueModal() {
	const split = useQueueSplit();
	const reorder = useQueueReorder(split.upcoming);
	const actionSheet = useQueueActionSheet();
	const rowActions = useQueueRowActions(actionSheet.onShowActions);
	return { list: { ...split, ...reorder }, rowActions, actionSheet };
}
