import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface TrackActionsButtonProps {
	/** Opens the track's `TrackActionsSheet`. */
	onPress: () => void;
}

/** The ⋯ button of a track row (#316); a long press on the row does the same. */
export function TrackActionsButton({ onPress }: TrackActionsButtonProps) {
	const { theme } = useTheme();
	return (
		<Pressable
			onPress={onPress}
			hitSlop={10}
			style={styles.button}
			accessibilityRole="button"
			accessibilityLabel="Actions"
		>
			<Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textSecondary} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 4,
	},
});
