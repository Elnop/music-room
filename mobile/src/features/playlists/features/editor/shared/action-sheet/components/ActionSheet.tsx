import React from 'react';
import { Modal } from 'react-native';
import { ActionSheetBackdrop } from '@/features/playlists/features/editor/shared/action-sheet/components/ActionSheetBackdrop';
import { ActionSheetPanel } from '@/features/playlists/features/editor/shared/action-sheet/components/ActionSheetPanel';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import type {
	ActionSheetHeading,
	ActionSheetMode,
	ActionSheetPlacement,
} from '@/features/playlists/features/editor/shared/action-sheet/actionSheetTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

type ActionSheetProps = {
	visible: boolean;
	heading: ActionSheetHeading;
	onClose: () => void;
	onDismiss?: () => void;
	placement?: ActionSheetPlacement;
	children: React.ReactNode;
};

const ANIMATIONS = { menu: 'none', dialog: 'fade', sheet: 'slide' } as const;

function sheetMode(isWide: boolean, dropDown: MenuAnchor | null): ActionSheetMode {
	if (dropDown) return 'menu';
	return isWide ? 'dialog' : 'sheet';
}

export function ActionSheet({ heading, placement = {}, children, ...modal }: ActionSheetProps) {
	const { isWide } = useBreakpoint();
	const dropDown = isWide && placement.anchor ? placement.anchor : null;
	const mode = sheetMode(isWide, dropDown);

	return (
		<Modal
			visible={modal.visible}
			animationType={ANIMATIONS[mode]}
			transparent
			onRequestClose={modal.onClose}
			onDismiss={modal.onDismiss}
		>
			<ActionSheetBackdrop mode={mode} anchor={dropDown} onClose={modal.onClose}>
				<ActionSheetPanel heading={heading} mode={mode} tall={!isWide && placement.tall === true}>
					{children}
				</ActionSheetPanel>
			</ActionSheetBackdrop>
		</Modal>
	);
}
