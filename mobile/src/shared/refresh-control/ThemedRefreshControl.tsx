import React from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';

/** On Android the list is passed as `children` (and its `style`): both must reach `RefreshControl`. */
export function ThemedRefreshControl({ color, ...props }: RefreshControlProps & { color: string }) {
	return <RefreshControl {...props} tintColor={color} colors={[color]} />;
}
