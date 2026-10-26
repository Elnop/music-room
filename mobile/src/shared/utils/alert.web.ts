import type { AlertButton } from 'react-native';

// Browser variant: react-native-web's Alert.alert does nothing, so the browser's own dialogs
// ask for each action in turn; the first one accepted runs, none runs the cancel button.

interface BrowserDialogs {
	alert(text: string): void;
	confirm(text: string): boolean;
}

// The project compiles without the DOM library, so the two dialogs are typed here.
const browser = globalThis as unknown as BrowserDialogs;

export function showAlert(title: string, message: string, buttons: AlertButton[]): void {
	const actions = buttons.filter(button => button.style !== 'cancel');
	const cancel = buttons.find(button => button.style === 'cancel');
	const text = `${title}\n\n${message}`;

	if (actions.length === 0) {
		browser.alert(text);
		cancel?.onPress?.();
		return;
	}
	const accepted = actions.find(action =>
		browser.confirm(actions.length === 1 ? text : `${text}\n\n${action.text ?? ''} ?`)
	);
	(accepted ?? cancel)?.onPress?.();
}
