import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { HEADER_HIT_SLOP, type createStyles } from './playerModalStyles';
import { Text } from '@/shared/components/ui/Text';

interface PlayerHeaderProps {
	styles: ReturnType<typeof createStyles>;
	colors: {
		text: string;
		textSecondary: string;
		buttonBg: string;
	};
	/** A dialog closes with ×, without the swipe handle of the phone's sheet. */
	dialog?: boolean;
	onClose: () => void;
}

export function PlayerHeader({ styles, colors, dialog = false, onClose }: PlayerHeaderProps) {
	return (
		<View style={styles.header}>
			<View style={styles.swipeIndicator}>
				<View
					style={[
						styles.swipeBar,
						{ backgroundColor: dialog ? 'transparent' : colors.textSecondary },
					]}
				/>
			</View>

			<Pressable
				style={styles.closeButton}
				onPress={onClose}
				hitSlop={HEADER_HIT_SLOP}
				accessibilityRole="button"
				accessibilityLabel="Fermer le lecteur"
			>
				<View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}>
					<Ionicons name={dialog ? 'close' : 'chevron-down'} size={24} color={colors.text} />
				</View>
			</Pressable>

			<Text style={[styles.nowPlayingText, { color: colors.textSecondary }]}>
				EN COURS DE LECTURE
			</Text>
		</View>
	);
}
