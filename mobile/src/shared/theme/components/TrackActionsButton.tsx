import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useMeasuredPress } from '@/shared/theme/hooks/useMeasuredPress';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import EllipsesHorizontalSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/ellipses-horizontal-solid.svg';

type TrackActionsButtonProps = {
	onPress: (anchor?: MenuAnchor) => void;
};

export function TrackActionsButton({ onPress }: TrackActionsButtonProps) {
	const { theme } = useTheme();
	const button = useRef<View>(null);
	const press = useMeasuredPress(button, onPress);
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
