import React from 'react';
import { Modal } from 'react-native';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { CenteredDialog } from './CenteredDialog';

interface FullScreenSheetProps {
	visible: boolean;
	onClose: () => void;
	children: React.ReactNode;
}

/** A sheet that covers the phone screen, and a centred dialog on wide screens; Escape closes it in a browser. */
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
