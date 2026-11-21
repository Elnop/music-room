import React from 'react';
import { View } from 'react-native';
import { ActionSheet } from '@/features/playlists/features/editor/shared/action-sheet/components/presenters/ActionSheet';
import { ActionSheetRow } from '@/features/playlists/features/editor/shared/action-sheet/components/presenters/ActionSheetRow';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';
import CameraSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/camera-solid.svg';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';
import PencilSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pencil-solid.svg';
import TimesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/times-solid.svg';
import TrashSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/trash-solid.svg';

export interface PlaylistActionsViewProps {
	visible: boolean;
	anchor: MenuAnchor | null;
	playlistName: string;
	onClose: () => void;
	onDismiss: () => void;
	onEdit: () => void;
	onSharing: () => void;
	onDelete: () => void;
	hasCover: boolean;
	coverLocked: boolean;
	onChangeCover: () => void;
	onRemoveCover: () => void;
}

export function PlaylistActionsView({
	visible,
	anchor,
	playlistName,
	onClose,
	onDismiss,
	onEdit,
	onSharing,
	onDelete,
	hasCover,
	coverLocked,
	onChangeCover,
	onRemoveCover,
}: PlaylistActionsViewProps) {
	return (
		<ActionSheet
			visible={visible}
			title={playlistName}
			onClose={onClose}
			onDismiss={onDismiss}
			anchor={anchor}
		>
			<View>
				<ActionSheetRow icon={PencilSolid} label="Modifier" onPress={onEdit} />
				<ActionSheetRow
					icon={coverLocked ? LockSolid : CameraSolid}
					label="Changer la cover"
					detail={coverLocked ? 'Réservé au Premium' : undefined}
					onPress={onChangeCover}
				/>
				{hasCover && (
					<ActionSheetRow icon={TimesSolid} label="Retirer la cover" onPress={onRemoveCover} />
				)}
				<ActionSheetRow icon={LockSolid} label="Visibilité et droits" onPress={onSharing} />
				<ActionSheetRow icon={TrashSolid} label="Supprimer" onPress={onDelete} destructive />
			</View>
		</ActionSheet>
	);
}
