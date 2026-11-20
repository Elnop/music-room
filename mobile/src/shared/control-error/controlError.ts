export interface ControlError {
	code: string;
	message: string;
}

export function controlErrorMessage(err: ControlError): string {
	switch (err.code) {
		case 'NOT_AUTHORIZED':
			return 'Vous ne pouvez pas contrôler cet appareil';
		case 'DEVICE_OFFLINE':
			return "Cet appareil n'est plus en ligne";
		default:
			return 'La commande a échoué, réessayez';
	}
}
