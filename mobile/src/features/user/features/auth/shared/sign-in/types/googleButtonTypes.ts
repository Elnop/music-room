export type GoogleButtonTarget = {
	offsetWidth: number;
};

export type GoogleButtonConfiguration = {
	type: 'standard';
	theme: 'outline' | 'filled_black';
	size: 'large' | 'medium';
	text: 'continue_with';
	shape: 'rectangular';
	logo_alignment: 'center' | 'left';
	locale: string;
	width?: number;
	click_listener: () => void;
};

export type GoogleButtonCallbacks = {
	onCredential: () => void;
	onFailure: () => void;
};
