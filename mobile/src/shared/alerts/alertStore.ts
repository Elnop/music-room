import { createStore } from 'zustand/vanilla';
import type { AlertButton } from 'react-native';

type AlertRequest = {
	title: string;
	message: string;
	buttons: AlertButton[];
};

type AlertState = {
	queue: AlertRequest[];
	push: (alert: AlertRequest) => void;
	dismiss: () => void;
};

export const alertStore = createStore<AlertState>(set => ({
	queue: [],
	push: alert => set(state => ({ queue: [...state.queue, alert] })),
	dismiss: () => set(state => ({ queue: state.queue.slice(1) })),
}));
