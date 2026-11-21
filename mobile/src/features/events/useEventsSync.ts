import { useSocketCache } from '@/shared/backend/hooks/useSocketCache';
import { EVENT_SOCKET_RULES } from '@/features/events/lib/eventSocketRules';

export function useEventsSync(): void {
	useSocketCache(EVENT_SOCKET_RULES);
}
