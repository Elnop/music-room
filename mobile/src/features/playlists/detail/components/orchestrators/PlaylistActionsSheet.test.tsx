import React from 'react';
import { Modal, Platform } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PlaylistActionsSheet } from './PlaylistActionsSheet';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const onClose = jest.fn();
const onEdit = jest.fn();
const onSharing = jest.fn();
const onDelete = jest.fn();

const renderSheet = (visible = true) =>
	render(
		<PlaylistActionsSheet
			visible={visible}
			playlistName="Les tubes du Crabe Croustillant"
			onClose={onClose}
			onEdit={onEdit}
			onSharing={onSharing}
			onDelete={onDelete}
		/>
	);

// jest-expo runs as iOS; the immediate run below is Android's.
const defaultOS = Platform.OS;

beforeEach(() => {
	jest.clearAllMocks();
	Platform.OS = 'android';
});

afterEach(() => {
	Platform.OS = defaultOS;
});

describe('PlaylistActionsSheet (#342)', () => {
	it('shows the playlist name and the three owner actions', () => {
		renderSheet();
		expect(screen.getByText('Les tubes du Crabe Croustillant')).toBeTruthy();
		expect(screen.getByLabelText('Modifier')).toBeTruthy();
		expect(screen.getByLabelText('Visibilité et droits')).toBeTruthy();
		expect(screen.getByLabelText('Supprimer')).toBeTruthy();
	});

	it.each([
		['Modifier', onEdit],
		['Visibilité et droits', onSharing],
		['Supprimer', onDelete],
	])('closes then runs « %s »', (label, action) => {
		renderSheet();
		fireEvent.press(screen.getByLabelText(label));
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(action).toHaveBeenCalledTimes(1);
		expect(onClose.mock.invocationCallOrder[0]).toBeLessThan(action.mock.invocationCallOrder[0]);
	});

	it('closes on the backdrop without running an action', () => {
		renderSheet();
		fireEvent.press(screen.getByLabelText('Fermer'));
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onEdit).not.toHaveBeenCalled();
		expect(onSharing).not.toHaveBeenCalled();
		expect(onDelete).not.toHaveBeenCalled();
	});

	it('renders nothing when hidden', () => {
		renderSheet(false);
		expect(screen.queryByLabelText('Modifier')).toBeNull();
	});

	describe('on iOS', () => {
		beforeEach(() => {
			Platform.OS = 'ios';
		});

		it('runs the action only once the Modal is dismissed', () => {
			renderSheet();
			fireEvent.press(screen.getByLabelText('Supprimer'));
			expect(onClose).toHaveBeenCalledTimes(1);
			expect(onDelete).not.toHaveBeenCalled();

			act(() => screen.UNSAFE_getByType(Modal).props.onDismiss());
			expect(onDelete).toHaveBeenCalledTimes(1);

			// A later dismiss without a new choice runs nothing.
			act(() => screen.UNSAFE_getByType(Modal).props.onDismiss());
			expect(onDelete).toHaveBeenCalledTimes(1);
		});
	});
});
