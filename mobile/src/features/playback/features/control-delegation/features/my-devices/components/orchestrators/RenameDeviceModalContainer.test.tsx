import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RenameDeviceModalContainer } from '@/features/playback/features/control-delegation/features/my-devices/components/orchestrators/RenameDeviceModalContainer';

jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('RenameDeviceModalContainer', () => {
	const onClose = jest.fn();
	const onSubmit = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders modal with device name when deviceName is provided', () => {
		render(
			<RenameDeviceModalContainer
				deviceName="Mon Enceinte"
				saving={false}
				onClose={onClose}
				onSubmit={onSubmit}
			/>,
		);

		expect(screen.getByText("Renommer l'appareil")).toBeTruthy();
		expect(screen.getByDisplayValue('Mon Enceinte')).toBeTruthy();
	});

	it('submits trimmed name on Enregistrer', () => {
		render(
			<RenameDeviceModalContainer
				deviceName="Mon Enceinte"
				saving={false}
				onClose={onClose}
				onSubmit={onSubmit}
			/>,
		);

		fireEvent.changeText(screen.getByDisplayValue('Mon Enceinte'), '  Salon  ');
		fireEvent.press(screen.getByText('Enregistrer'));

		expect(onSubmit).toHaveBeenCalledWith('Salon');
	});

	it('shows error when name is empty', () => {
		render(
			<RenameDeviceModalContainer
				deviceName="Mon Enceinte"
				saving={false}
				onClose={onClose}
				onSubmit={onSubmit}
			/>,
		);

		fireEvent.changeText(screen.getByDisplayValue('Mon Enceinte'), '   ');
		fireEvent.press(screen.getByText('Enregistrer'));

		expect(screen.getByText('Saisissez un nom')).toBeTruthy();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('shows error when name exceeds 40 characters', () => {
		render(
			<RenameDeviceModalContainer
				deviceName="Mon Enceinte"
				saving={false}
				onClose={onClose}
				onSubmit={onSubmit}
			/>,
		);

		fireEvent.changeText(screen.getByDisplayValue('Mon Enceinte'), 'a'.repeat(45));
		fireEvent.press(screen.getByText('Enregistrer'));

		expect(screen.getByText('40 caractères au maximum')).toBeTruthy();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('submits null on Nom d’origine', () => {
		render(
			<RenameDeviceModalContainer
				deviceName="Mon Enceinte"
				saving={false}
				onClose={onClose}
				onSubmit={onSubmit}
			/>,
		);

		fireEvent.press(screen.getByText("Nom d'origine"));
		expect(onSubmit).toHaveBeenCalledWith(null);
	});

	it('calls onClose on Annuler and on backdrop press', () => {
		render(
			<RenameDeviceModalContainer
				deviceName="Mon Enceinte"
				saving={false}
				onClose={onClose}
				onSubmit={onSubmit}
			/>,
		);

		fireEvent.press(screen.getByText('Annuler'));
		expect(onClose).toHaveBeenCalledWith(undefined);

		fireEvent.press(screen.getByLabelText('Fermer'));
		expect(onClose).toHaveBeenCalledTimes(2);
	});
});
