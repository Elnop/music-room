import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { openExternalUrl } from '@/shared/external-links/openExternalUrl';
import { PrivacyPolicyContainer } from '@/features/legal/components/PrivacyPolicyContainer';

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});
jest.mock('@/shared/external-links/openExternalUrl', () => ({ openExternalUrl: jest.fn() }));

describe('PrivacyPolicyContainer', () => {
	it('shows every section of the policy', () => {
		render(<PrivacyPolicyContainer />);

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
		render(<PrivacyPolicyContainer />);

		fireEvent.press(screen.getByText('CNIL'));
		fireEvent.press(screen.getAllByText('leon.perrotin@gmail.com')[0]);

		expect(openExternalUrl).toHaveBeenNthCalledWith(1, 'https://www.cnil.fr', expect.any(Function));
		expect(openExternalUrl).toHaveBeenNthCalledWith(
			2,
			'mailto:leon.perrotin@gmail.com',
			expect.any(Function)
		);
	});
});
