import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

// The state can be unknown at launch: only an app known to be in the background counts as away.
const isActive = (state: AppStateStatus | null) => state !== 'background' && state !== 'inactive';

/** False while the app is in the background: sensors stop to save the battery. */
export function useAppActive(): boolean {
	const [active, setActive] = useState(() => isActive(AppState.currentState));

	useEffect(() => {
		const subscription = AppState.addEventListener('change', state => setActive(isActive(state)));
		return () => subscription.remove();
	}, []);

	return active;
}
