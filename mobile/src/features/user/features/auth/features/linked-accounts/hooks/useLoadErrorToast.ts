import { useEffect } from 'react';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError } from '@/shared/theme/lib/toast';

type LoadState = {
	error: Error | null;
	isFetchedAfterMount: boolean;
};

export function useLoadErrorToast({ error, isFetchedAfterMount }: LoadState): void {
	useEffect(() => {
		if (error && isFetchedAfterMount) {
			showError(apiErrorMessage(error, 'Impossible de charger les comptes liés'));
		}
	}, [error, isFetchedAfterMount]);
}
