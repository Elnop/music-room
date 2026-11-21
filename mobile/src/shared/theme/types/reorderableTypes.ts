import type { ReactElement } from 'react';
import type { PanGesture } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

export type ReorderableRenderItemInfo<T> = {
	item: T;
	index: number;
	drag: () => void;
	isActive: boolean;
};

export type ReorderableRenderItem<T> = (info: ReorderableRenderItemInfo<T>) => ReactElement | null;

export type ReorderableKeyExtractor<T> = (item: T, index: number) => string;

export type ReorderHandler = (from: number, to: number) => void | Promise<unknown>;

export type DragDecision = {
	dragRequested: SharedValue<boolean>;
	panGesture: PanGesture;
};
