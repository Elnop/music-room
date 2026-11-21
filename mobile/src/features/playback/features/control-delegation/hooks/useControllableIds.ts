import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchControllable } from '@/features/playback/features/control-delegation/lib/fetchControllable';
import type { ControllableIds } from '@/features/playback/features/control-delegation/controlDelegationTypes';

export function useControllableIds(targetUserId: string | null) {
	const [controllable, setControllable] = useState<ControllableIds | null>(null);
	const generation = useRef(0);

	useEffect(() => {
		if (!targetUserId) return;
		fetchControllable(targetUserId, generation, setControllable);
		return () => {
			generation.current += 1;
		};
	}, [targetUserId]);

	const reload = useCallback(() => {
		if (targetUserId) fetchControllable(targetUserId, generation, setControllable);
	}, [targetUserId]);

	return { controllable, reload };
}
