import React from 'react';
import { Modal } from 'react-native';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { CenteredDialog } from '@/shared/theme/components/CenteredDialog';
import type { SheetProps } from '@/features/playback/shared/full-screen-sheet/playerSheetsTypes';

type FullScreenSheetProps = SheetProps & {
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
