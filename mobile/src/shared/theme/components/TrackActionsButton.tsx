import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useMeasuredPress } from '@/shared/theme/hooks/useMeasuredPress';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import EllipsesHorizontalSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/ellipses-horizontal-solid.svg';

type TrackActionsButtonProps = {
	onPress: (anchor?: MenuAnchor) => void;
};

export function TrackActionsButton({ onPress }: TrackActionsButtonProps) {
	const { styles, theme } = useThemedStyles(createStyles);
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

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		button: {
			width: theme.controls.iconButton,
			height: theme.controls.iconButton,
			alignItems: 'center',
			justifyContent: 'center',
			marginLeft: theme.spacing.xs,
		},
	});
	return styles;
}
