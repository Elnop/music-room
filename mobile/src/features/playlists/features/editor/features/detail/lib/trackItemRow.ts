import type { Track } from '@/shared/tracks/types/trackTypes';
import type {
	TrackItemHandlers,
	TrackItemState,
	TrackRowActions,
	TrackRowState,
} from '@/features/playlists/features/editor/features/detail/types/trackRowTypes';

export function rowState(state: TrackItemState): TrackRowState {
	return {
		isCurrent: state.isCurrent ?? false,
		isPending: state.isPending ?? false,
		unavailable: state.unavailable ?? false,
		isDragActive: state.isDragActive ?? false,
	};
}

export function rowActions(state: TrackItemState, handlers: TrackItemHandlers): TrackRowActions {
	return {
		onPress: handlers.onPress,
		onShowActions: state.unavailable ? undefined : handlers.onShowActions,
		onDragStart: state.disabled ? undefined : handlers.onDragStart,
	};
}

export function rowLabel(track: Track, unavailable: boolean): string {
	return `${track.title}, ${track.artist}${unavailable ? ', indisponible' : ''}`;
}

export function rowAccessibility(state: TrackRowState) {
	return { selected: state.isCurrent, busy: state.isPending, disabled: state.unavailable };
}
