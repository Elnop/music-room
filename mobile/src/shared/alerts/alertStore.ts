import { create } from 'zustand';
import type { AlertButton } from 'react-native';

interface AlertRequest {
	title: string;
	message: string;
	buttons: AlertButton[];
}

interface AlertState {
	/** Alerts asked for while one is open wait their turn, as native alerts do. */
	queue: AlertRequest[];
	push: (alert: AlertRequest) => void;
	dismiss: () => void;
}

/** Browser only: native platforms use their own Alert. */
export const useAlertStore = create<AlertState>(set => ({
	queue: [],
	push: alert => set(state => ({ queue: [...state.queue, alert] })),
	dismiss: () => set(state => ({ queue: state.queue.slice(1) })),
}));
