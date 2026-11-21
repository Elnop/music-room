import React from 'react';
import { RefreshControl } from 'react-native';
import type { RefreshControlProps } from 'react-native';

export function ThemedRefreshControl({ color, ...props }: RefreshControlProps & { color: string }) {
	return <RefreshControl {...props} tintColor={color} colors={[color]} />;
}
