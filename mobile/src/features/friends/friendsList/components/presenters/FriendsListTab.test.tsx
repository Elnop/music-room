import React from 'react';
import { FlatList, useWindowDimensions } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { FriendsListTab } from './FriendsListTab';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(),
}));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

const mockWidth = (width: number) =>
	jest.mocked(useWindowDimensions).mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });

const friends = [
	{ id: 'p', username: 'patrick', displayName: 'Patrick Étoile' },
	{ id: 's', username: 'sandy' },
];

const renderTab = (onToggleControl = jest.fn()) => {
	render(
		<FriendsListTab
			friends={friends}
			isLoading={false}
			loadFailed={false}
			onRetry={jest.fn()}
			isRefreshing={false}
			onRefresh={jest.fn()}
			canControl={id => id === 's'}
			togglingUserId={null}
			onToggleControl={onToggleControl}
			onSelectUser={jest.fn()}
			onGoToSearch={jest.fn()}
			bottomPadding={0}
		/>
	);
	return onToggleControl;
};

describe('FriendsListTab', () => {
	it('names the control switch of each friend on the phone', async () => {
		mockWidth(390);
		renderTab();
		await act(async () => {});
		expect(screen.getByLabelText('Patrick Étoile peut contrôler ma musique')).toBeTruthy();
		expect(screen.queryByText(/sur tous mes appareils/)).toBeNull();
	});

	it('spells out what the switch grants on desktop, and spreads a short list over the width', async () => {
		mockWidth(1440);
		const onToggleControl = renderTab();
		await act(async () => {});
		expect(screen.getAllByText('Peut contrôler ma musique sur tous mes appareils')).toHaveLength(2);
		expect(screen.UNSAFE_getByType(FlatList).props.numColumns).toBe(2);
		fireEvent(
			screen.getByLabelText('sandy peut contrôler ma musique sur tous mes appareils'),
			'valueChange',
			false
		);
		expect(onToggleControl).toHaveBeenCalledWith('s', true);
	});
});
