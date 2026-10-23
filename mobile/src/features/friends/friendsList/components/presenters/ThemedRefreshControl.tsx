import React from 'react';
import { RefreshControl } from 'react-native';

export function ThemedRefreshControl({
	refreshing,
	onRefresh,
	color,
}: {
	refreshing: boolean;
	onRefresh: () => void;
	color: string;
}) {
	return (
		<RefreshControl
			refreshing={refreshing}
			onRefresh={onRefresh}
			tintColor={color}
			colors={[color]}
		/>
	);
}
