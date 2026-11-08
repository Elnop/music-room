import { useSocketCache } from '@/shared/query/socketCache';
import { EVENT_SOCKET_RULES } from '@/features/events/utils/eventSocketRules';

export function useEventsSync(): void {
	useSocketCache(EVENT_SOCKET_RULES);
}
