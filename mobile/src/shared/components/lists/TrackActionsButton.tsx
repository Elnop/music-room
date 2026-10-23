import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';

interface TrackActionsButtonProps {
	/** Opens the track's quick actions sheet. */
	onPress: () => void;
}

/** A long press on the row does the same. */
export function TrackActionsButton({ onPress }: TrackActionsButtonProps) {
	const { theme } = useTheme();
	return (
		<Pressable onPress={onPress} hitSlop={10} style={styles.button} accessibilityLabel="Actions">
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
