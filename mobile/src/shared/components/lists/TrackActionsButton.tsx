import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useAnchoredPress } from '@/shared/hooks/useAnchoredPress';
import { useTheme } from '@/shared/theme/ThemeContext';
import EllipsesHorizontalSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/ellipses-horizontal-solid.svg';

interface TrackActionsButtonProps {
	onPress: () => void;
}

export function TrackActionsButton({ onPress }: TrackActionsButtonProps) {
	const { theme } = useTheme();
	const button = useRef<View>(null);
	const press = useAnchoredPress(button, onPress);
	return (
		<View ref={button} collapsable={false}>
			<Pressable onPress={press} hitSlop={10} style={styles.button} accessibilityLabel="Actions">
				<PixelIcon icon={EllipsesHorizontalSolid} size={20} color={theme.colors.textSecondary} />
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
