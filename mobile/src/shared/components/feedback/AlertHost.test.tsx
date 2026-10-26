import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useAlertStore } from '@/shared/stores/alertStore';
import { AlertHost } from './AlertHost';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme: theme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme }) };
});

const push = (buttons: Parameters<ReturnType<typeof useAlertStore.getState>['push']>[0]['buttons']) =>
	act(() => useAlertStore.getState().push({ title: 'Supprimer ?', message: 'Définitif.', buttons }));

beforeEach(() => useAlertStore.setState({ queue: [] }));

describe('AlertHost', () => {
	it('renders nothing without an alert, as on native platforms', () => {
		render(<AlertHost />);
		expect(screen.toJSON()).toBeNull();
	});

	it('shows the alert with every button, and runs the one pressed', () => {
		const remove = jest.fn();
		const archive = jest.fn();
		render(<AlertHost />);
		push([
			{ text: 'Annuler', style: 'cancel' },
			{ text: 'Archiver', onPress: archive },
			{ text: 'Supprimer', style: 'destructive', onPress: remove },
		]);

		expect(screen.getByText('Supprimer ?')).toBeTruthy();
		expect(screen.getByText('Définitif.')).toBeTruthy();
		fireEvent.press(screen.getByRole('button', { name: 'Supprimer' }));

		expect(remove).toHaveBeenCalledTimes(1);
		expect(archive).not.toHaveBeenCalled();
		expect(screen.queryByText('Supprimer ?')).toBeNull();
	});

	it('runs the cancel button on the backdrop and on Escape', () => {
		const cancel = jest.fn();
		render(<AlertHost />);
		push([{ text: 'Annuler', style: 'cancel', onPress: cancel }, { text: 'Supprimer' }]);
		fireEvent.press(screen.getByLabelText('Fermer'));
		expect(cancel).toHaveBeenCalledTimes(1);

		push([{ text: 'Annuler', style: 'cancel', onPress: cancel }, { text: 'Supprimer' }]);
		act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());
		expect(cancel).toHaveBeenCalledTimes(2);
		expect(screen.toJSON()).toBeNull();
	});

	it('offers OK when the alert has no button', () => {
		render(<AlertHost />);
		push([]);
		fireEvent.press(screen.getByRole('button', { name: 'OK' }));
		expect(screen.toJSON()).toBeNull();
	});

	it('shows queued alerts one after the other', () => {
		render(<AlertHost />);
		push([{ text: 'Premier' }]);
		act(() => useAlertStore.getState().push({ title: 'Deuxième', message: '', buttons: [] }));
		fireEvent.press(screen.getByRole('button', { name: 'Premier' }));
		expect(screen.getByText('Deuxième')).toBeTruthy();
	});
});
