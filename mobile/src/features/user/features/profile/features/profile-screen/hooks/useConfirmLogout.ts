import { useCallback, useState } from 'react';
import { showAlert } from '@/shared/alerts/showAlert';
import { logout } from '@/features/user/features/profile/shared/profile/lib/sessionActions';
import { logger } from '@/shared/logging/logger';

export function useConfirmLogout() {
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = useCallback(async () => {
		try {
			setIsLoggingOut(true);
			await logout();
		} catch (error) {
			logger.error('[ProfileScreen] Logout failed:', error);
		} finally {
			setIsLoggingOut(false);
		}
	}, []);

	const confirmLogout = useCallback(() => {
		showAlert('Se déconnecter ?', 'Vous devrez vous reconnecter pour utiliser Zumik.', [
			{ text: 'Annuler', style: 'cancel' },
			{ text: 'Se déconnecter', style: 'destructive', onPress: handleLogout },
		]);
	}, [handleLogout]);

	return { isLoggingOut, confirmLogout };
}
