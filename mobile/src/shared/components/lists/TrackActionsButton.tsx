import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useAnchoredPress } from '@/shared/hooks/useAnchoredPress';
import { useTheme } from '@/shared/theme/ThemeContext';

interface TrackActionsButtonProps {
	/** Opens the track's quick actions sheet. */
	onPress: () => void;
}

/** A long press on the row does the same. */
export function TrackActionsButton({ onPress }: TrackActionsButtonProps) {
	const { theme } = useTheme();
	const button = useRef<View>(null);
	const press = useAnchoredPress(button, onPress);
	return (
		<View ref={button} collapsable={false}>
			<Pressable onPress={press} hitSlop={10} style={styles.button} accessibilityLabel="Actions">
				<Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textSecondary} />
			</Pressable>
		</View>
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
