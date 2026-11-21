export type ButtonVariant = 'primary' | 'secondary' | 'outline';

export type ButtonSize = 'default' | 'compact';

export type ButtonLook = {
	variant: ButtonVariant;
	size: ButtonSize;
	fullWidth: boolean;
	disabled: boolean;
};
