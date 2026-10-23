import type { ListeningStatus } from '@/types/listening.types';

/** Remote progress: the sent position, plus the time elapsed since while playing. */
export function estimatePositionMs(
	status: Pick<ListeningStatus, 'positionMs' | 'updatedAt' | 'isPlaying'>,
	now: number,
	durationMs: number | null
): number {
	const base = status.positionMs ?? 0;
	const sentAt = Date.parse(status.updatedAt);
	const elapsed = status.isPlaying && Number.isFinite(sentAt) ? Math.max(0, now - sentAt) : 0;
	const position = base + elapsed;
	return durationMs !== null ? Math.min(position, durationMs) : position;
}
