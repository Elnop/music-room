import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { HEADER_HIT_SLOP, type createStyles } from './playerModalStyles';

interface PlayerHeaderProps {
	styles: ReturnType<typeof createStyles>;
	colors: {
		text: string;
		textSecondary: string;
		buttonBg: string;
	};
	onClose: () => void;
}

export function PlayerHeader({ styles, colors, onClose }: PlayerHeaderProps) {
	return (
		<View style={styles.header}>
			<View style={styles.swipeIndicator}>
				<View style={[styles.swipeBar, { backgroundColor: colors.textSecondary }]} />
			</View>

			<Pressable
				style={styles.closeButton}
				onPress={onClose}
				hitSlop={HEADER_HIT_SLOP}
				accessibilityRole="button"
				accessibilityLabel="Fermer le lecteur"
			>
				<View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}>
					<Ionicons name="chevron-down" size={24} color={colors.text} />
				</View>
			</Pressable>

			<Text style={[styles.nowPlayingText, { color: colors.textSecondary }]}>
				EN COURS DE LECTURE
			</Text>
		</View>
	);
}
