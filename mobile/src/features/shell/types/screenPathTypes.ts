import type { AppTabsParamList } from '@/app/AppNavigator';

export type AppTab = keyof AppTabsParamList;

export type StackRoute = {
	name: string;
	params?: object;
};

export type ScreenPath = {
	screen: string;
	path: string;
	param?: string;
	tab?: AppTab;
	routes: (id: string) => StackRoute[];
	isShareLink?: true;
};

export type ScreenPathMatch = {
	entry: ScreenPath;
	id: string;
};

export type RouteNode = {
	name: string;
	params?: object;
	state?: StateNode;
};

export type StateNode = {
	index?: number;
	routes: readonly RouteNode[];
};

export type NestedParams = {
	screen?: string;
	params?: object;
};
