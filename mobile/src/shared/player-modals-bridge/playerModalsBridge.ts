import React from 'react';

interface ModalProps {
	visible: boolean;
	onClose: () => void;
}

type ModalComponent = React.ComponentType<ModalProps>;

interface PlayerModalsRegistry {
	QueueModalContainer: ModalComponent | null;
	DevicePickerSheetContainer: ModalComponent | null;
}

const registry: PlayerModalsRegistry = {
	QueueModalContainer: null,
	DevicePickerSheetContainer: null,
};

export function registerPlayerModals(modals: Partial<PlayerModalsRegistry>): void {
	Object.assign(registry, modals);
}

export function getPlayerModal(name: keyof PlayerModalsRegistry): ModalComponent | null {
	return registry[name];
}
