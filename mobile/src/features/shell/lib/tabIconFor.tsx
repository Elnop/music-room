import React from 'react';
import { TabIcon } from '@/features/shell/components/presenters/TabIcon';

type TabIconState = {
	focused: boolean;
	color: string;
};

export function tabIconFor(routeName: string) {
	return ({ focused, color }: TabIconState) => (
		<TabIcon routeName={routeName} focused={focused} color={color} />
	);
}
