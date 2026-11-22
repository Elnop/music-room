import type { AdvertiseFailure } from '@/features/events/features/detail/eventDetailTypes';

export class AdvertiseError extends Error {
	constructor(
		readonly reason: AdvertiseFailure,
		cause?: unknown,
	) {
		super(`Beacon advertising failed: ${reason}`, { cause });
	}
}
