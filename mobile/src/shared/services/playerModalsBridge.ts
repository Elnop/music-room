import React from 'react';

interface ModalProps {
	visible: boolean;
	onClose: () => void;
}

type ModalComponent = React.ComponentType<ModalProps>;

interface PlayerModalsRegistry {
	QueueModal: ModalComponent | null;
	DevicePickerSheet: ModalComponent | null;
}

const registry: PlayerModalsRegistry = {
	QueueModal: null,
	DevicePickerSheet: null,
};

export function registerPlayerModals(modals: Partial<PlayerModalsRegistry>): void {
	Object.assign(registry, modals);
}

export function getPlayerModal(name: keyof PlayerModalsRegistry): ModalComponent | null {
	return registry[name];
}
