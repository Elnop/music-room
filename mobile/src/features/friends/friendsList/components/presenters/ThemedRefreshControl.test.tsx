import React from 'react';
import { RefreshControl, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ThemedRefreshControl } from './ThemedRefreshControl';

describe('ThemedRefreshControl', () => {
	it('hands RefreshControl the list and the style Android wraps in it', () => {
		const list = <Text>list</Text>;
		const style = { flex: 1 };

		render(
			<ThemedRefreshControl refreshing={false} onRefresh={jest.fn()} color="transparent" style={style}>
				{list}
			</ThemedRefreshControl>
		);

		const control = screen.UNSAFE_getByType(RefreshControl);
		expect(control.props.children).toBe(list);
		expect(control.props.style).toBe(style);
		expect(control.props.colors).toEqual(['transparent']);
	});
});
