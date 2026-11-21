import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import { Text } from '@/shared/theme/components/Text';
import { FONT_FAMILIES } from '@/shared/theme/lib/fonts';
import PlaylistSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/playlist-solid.svg';

const QUEUE_ACTION_WIDTH = 100;

interface QueueSwipeProps {
	children: React.ReactNode;
	onAddToQueue?: () => void;
	renderRightActions?: () => React.ReactNode;
}

export function QueueSwipe({ children, onAddToQueue, renderRightActions }: QueueSwipeProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	function renderLeftActions() {
		return (
			<View style={styles.queueAction} accessible accessibilityLabel="Ajouter à la file d'attente">
				<PixelIcon icon={PlaylistSolid} size={24} color={theme.colors.onColor} />
				<Text style={styles.queueText}>À la file</Text>
			</View>
		);
	}

	function handleOpen(direction: 'left' | 'right', swipeable: Swipeable) {
		if (direction !== 'left') return;
		swipeable.close();
		onAddToQueue?.();
	}

	return (
		<Swipeable
			renderLeftActions={onAddToQueue ? renderLeftActions : undefined}
			renderRightActions={renderRightActions}
			onSwipeableOpen={handleOpen}
			overshootLeft={false}
			overshootRight={false}
			friction={2}
			enabled={Boolean(onAddToQueue) || Boolean(renderRightActions)}
		>
			{children}
		</Swipeable>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		queueAction: {
			backgroundColor: theme.colors.primary,
			justifyContent: 'center',
			alignItems: 'center',
			width: QUEUE_ACTION_WIDTH,
			height: '100%',
		},
		queueText: {
			color: theme.colors.onColor,
			fontSize: 12,
			fontFamily: FONT_FAMILIES.semibold,
			marginTop: 4,
		},
	});
}
