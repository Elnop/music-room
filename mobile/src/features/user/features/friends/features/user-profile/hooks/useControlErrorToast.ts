import { useEffect } from 'react';
import { controlErrorMessage } from '@/shared/control-error/controlErrorMessage';
import type { ControlError } from '@/shared/control-error/controlErrorTypes';
import { showError } from '@/shared/theme/lib/toast';

export function useControlErrorToast(controlError: ControlError | null | undefined) {
	useEffect(() => {
		if (controlError) {
			showError(controlErrorMessage(controlError));
		}
	}, [controlError]);
}
