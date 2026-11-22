import React from 'react';
import type { AlertButton } from 'react-native';
import { useAlertState } from '@/features/shell/hooks/useAlertState';
import { AlertDialog } from '@/features/shell/components/presenters/AlertDialog';

const OK_BUTTON: AlertButton = { text: 'OK' };

export function AlertHostContainer() {
	const alert = useAlertState((state) => state.queue[0]);
	const dismiss = useAlertState((state) => state.dismiss);

	if (!alert) return null;

	const buttons = alert.buttons.length > 0 ? alert.buttons : [OK_BUTTON];
	function choose(button?: AlertButton) {
		dismiss();
		button?.onPress?.();
	}
	function cancel() {
		return choose(buttons.find((button) => button.style === 'cancel'));
	}

	return (
		<AlertDialog
			title={alert.title}
			message={alert.message}
			buttons={buttons}
			onChoose={choose}
			onCancel={cancel}
		/>
	);
}
