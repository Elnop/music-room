import { useStore } from 'zustand';
import { sessionStore } from '@/shared/backend/lib/authSession';
import type { SessionView } from '@/shared/backend/types/sessionTypes';

export function useSession<T>(selector: (session: SessionView) => T): T {
	return useStore(sessionStore(), selector);
}
