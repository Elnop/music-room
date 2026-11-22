import { useRef } from 'react';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { showAlert } from '@/shared/alerts/showAlert';

export function useUnsavedPrivacyGuard(hasChanges: boolean) {
	const navigation = useNavigation();
	const savedRef = useRef(false);

	usePreventRemove(hasChanges, ({ data: navData }) => {
		if (savedRef.current) {
			navigation.dispatch(navData.action);
			return;
		}
		showAlert(
			'Quitter sans enregistrer ?',
			'Vos modifications de confidentialité seront perdues.',
			[
				{ text: 'Annuler', style: 'cancel' },
				{
					text: 'Quitter sans enregistrer',
					style: 'destructive',
					onPress: () => navigation.dispatch(navData.action),
				},
			],
		);
	});

	return savedRef;
}
