import React from 'react';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useInsetStyles } from '@/features/playback/features/player-modal/hooks/useInsetStyles';
import { createFrameStyles } from '@/features/playback/features/player-modal/lib/createFrameStyles';

type PlayerDialogBackdropProps = {
	onClose: () => void;
};

export function PlayerDialogBackdrop({ onClose }: PlayerDialogBackdropProps) {
	const { styles } = useInsetStyles(createFrameStyles);

	return (
		<Pressable
			style={styles.dialogBackdrop}
			onPress={onClose}
			accessibilityRole="none"
			accessibilityLabel="Fermer le lecteur"
		/>
	);
}
