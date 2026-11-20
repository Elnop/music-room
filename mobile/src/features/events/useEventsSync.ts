import { useSocketCache } from '@/shared/backend/lib/socketCache';
import { EVENT_SOCKET_RULES } from '@/features/events/lib/eventSocketRules';

/** Mounted once for the signed-in app, so every event screen stays current without polling. */
export function useEventsSync(): void {
	useSocketCache(EVENT_SOCKET_RULES);
}
