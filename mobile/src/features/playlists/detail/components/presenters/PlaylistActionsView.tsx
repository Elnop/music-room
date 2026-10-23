import React from 'react';
import { View } from 'react-native';
import { ActionSheet } from '@/features/playlists/actionSheet/components/presenters/ActionSheet';
import { ActionSheetRow } from '@/features/playlists/actionSheet/components/presenters/ActionSheetRow';

interface PlaylistActionsViewProps {
	visible: boolean;
	playlistName: string;
	onClose: () => void;
	onDismiss: () => void;
	onEdit: () => void;
	onSharing: () => void;
	onDelete: () => void;
}

export function PlaylistActionsView({
	visible,
	playlistName,
	onClose,
	onDismiss,
	onEdit,
	onSharing,
	onDelete,
}: PlaylistActionsViewProps) {
	return (
		<ActionSheet visible={visible} title={playlistName} onClose={onClose} onDismiss={onDismiss}>
			<View>
				<ActionSheetRow icon="create-outline" label="Modifier" onPress={onEdit} />
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
