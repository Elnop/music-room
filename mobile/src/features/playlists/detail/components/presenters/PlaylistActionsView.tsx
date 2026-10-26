import React from 'react';
import { View } from 'react-native';
import { ActionSheet } from '@/features/playlists/actionSheet/components/presenters/ActionSheet';
import { ActionSheetRow } from '@/features/playlists/actionSheet/components/presenters/ActionSheetRow';

export interface PlaylistActionsViewProps {
	visible: boolean;
	/** Shown as the sheet's title. */
	playlistName: string;
	onClose: () => void;
	onDismiss: () => void;
	onEdit: () => void;
	onSharing: () => void;
	onDelete: () => void;
	/** The playlist has a custom cover: « Retirer la cover » is offered. */
	hasCover: boolean;
	/** Free plan: « Changer la cover » shows a lock and explains the Premium. */
	coverLocked: boolean;
	onChangeCover: () => void;
	onRemoveCover: () => void;
}

export function PlaylistActionsView({
	visible,
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
		<ActionSheet visible={visible} title={playlistName} onClose={onClose} onDismiss={onDismiss}>
			<View>
				<ActionSheetRow icon="create-outline" label="Modifier" onPress={onEdit} />
				<ActionSheetRow
					icon={coverLocked ? 'lock-closed' : 'image-outline'}
					label="Changer la cover"
					detail={coverLocked ? 'Réservé au Premium' : undefined}
					onPress={onChangeCover}
				/>
				{hasCover && (
					<ActionSheetRow
						icon="close-circle-outline"
						label="Retirer la cover"
						onPress={onRemoveCover}
					/>
				)}
				<ActionSheetRow
					icon="lock-closed-outline"
					label="Visibilité et droits"
					onPress={onSharing}
				/>
				<ActionSheetRow icon="trash-outline" label="Supprimer" onPress={onDelete} destructive />
			</View>
		</ActionSheet>
	);
}
