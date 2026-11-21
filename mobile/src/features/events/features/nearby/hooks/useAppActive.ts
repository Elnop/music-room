import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const isActive = (state: AppStateStatus | null) => state !== 'background' && state !== 'inactive';

export function useAppActive(): boolean {
	const [active, setActive] = useState(() => isActive(AppState.currentState));

	useEffect(() => {
		const subscription = AppState.addEventListener('change', state => setActive(isActive(state)));
		return () => subscription.remove();
	}, []);

	return active;
}
