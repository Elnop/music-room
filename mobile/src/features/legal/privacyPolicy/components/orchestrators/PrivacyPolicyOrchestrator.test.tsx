import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { openExternalUrl } from '@/shared/utils/openExternalUrl';
import { PrivacyPolicyOrchestrator } from './PrivacyPolicyOrchestrator';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});
jest.mock('@/shared/utils/openExternalUrl', () => ({ openExternalUrl: jest.fn() }));

describe('PrivacyPolicyOrchestrator', () => {
	it('shows every section of the policy', () => {
		render(<PrivacyPolicyOrchestrator />);

		for (const title of [
			'Données collectées',
			'Utilisation',
			'Données utilisateur Google',
			'Qui traite vos données',
			'Conservation et suppression',
			'Vos droits',
			'Sécurité',
			'Enfants',
			'Modifications',
			'Contact',
		]) {
			expect(screen.getByText(title)).toBeTruthy();
		}
		expect(screen.getByText('Dernière mise à jour : 25 octobre 2026')).toBeTruthy();
	});

	it('opens its links outside the app', () => {
		render(<PrivacyPolicyOrchestrator />);

		fireEvent.press(screen.getByText('CNIL'));
		fireEvent.press(screen.getAllByText('leon.perrotin@gmail.com')[0]);

		expect(openExternalUrl).toHaveBeenNthCalledWith(1, 'https://www.cnil.fr');
		expect(openExternalUrl).toHaveBeenNthCalledWith(2, 'mailto:leon.perrotin@gmail.com');
	});
});
