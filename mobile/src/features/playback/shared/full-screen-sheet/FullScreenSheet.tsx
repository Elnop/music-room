import React from 'react';
import { Modal } from 'react-native';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { CenteredDialog } from '@/shared/theme/components/CenteredDialog';

export type SheetComponent = React.ComponentType<{ visible: boolean; onClose: () => void }>;

export type PlayerSheets = {
	QueueModal: SheetComponent;
	DevicePicker: SheetComponent;
};

type FullScreenSheetProps = {
	visible: boolean;
	onClose: () => void;
	children: React.ReactNode;
};

export function FullScreenSheet({ visible, onClose, children }: FullScreenSheetProps) {
	const { isWide } = useBreakpoint();

	return (
		<Modal
			visible={visible}
			animationType={isWide ? 'fade' : 'slide'}
			presentationStyle="overFullScreen"
			transparent
			onRequestClose={onClose}
		>
			{isWide ? (
				<CenteredDialog onClose={onClose} fill>
					{children}
				</CenteredDialog>
			) : (
				children
			)}
		</Modal>
	);
}
