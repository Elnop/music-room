import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

function isActive(state: AppStateStatus | null) {
	return state !== 'background' && state !== 'inactive';
}

export function useAppActive(): boolean {
	const [active, setActive] = useState(() => isActive(AppState.currentState));

	useEffect(() => {
		const subscription = AppState.addEventListener('change', state => setActive(isActive(state)));
		return () => subscription.remove();
	}, []);

	return active;
}
