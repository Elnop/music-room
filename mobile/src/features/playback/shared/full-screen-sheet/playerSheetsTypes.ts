import type React from 'react';

export type SheetProps = {
	visible: boolean;
	onClose: () => void;
};

export type SheetComponent = React.ComponentType<SheetProps>;

export type PlayerSheets = {
	QueueModal: SheetComponent;
	DevicePicker: SheetComponent;
};
