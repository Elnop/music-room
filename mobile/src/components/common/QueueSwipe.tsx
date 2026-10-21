import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@/themes/types';

const QUEUE_ACTION_WIDTH = 100;

interface QueueSwipeProps {
	children: React.ReactNode;
	/** Called once when the row is swiped right past the threshold; shows the queue panel. */
	onAddToQueue?: () => void;
	/** Panel revealed by a left swipe (e.g. delete); none when omitted. */
	renderRightActions?: () => React.ReactNode;
}

/**
 * Track row swipe (#275): a right swipe reveals a queue panel, adds the track
 * to the queue once fully open and springs the row back. A left swipe shows
 * `renderRightActions` when given. A release before the threshold sends nothing.
 */
export function QueueSwipe({ children, onAddToQueue, renderRightActions }: QueueSwipeProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const renderLeftActions = () => (
		<View style={styles.queueAction} accessible accessibilityLabel="Ajouter à la file d'attente">
			<Ionicons name="list" size={24} color="#FFFFFF" />
			<Text style={styles.queueText}>À la file</Text>
		</View>
	);

	const handleOpen = (direction: 'left' | 'right', swipeable: Swipeable) => {
		// 'left' = the left actions are open, i.e. the row was swiped right.
		if (direction !== 'left') return;
		swipeable.close();
		onAddToQueue?.();
	};

	return (
		<Swipeable
			renderLeftActions={onAddToQueue ? renderLeftActions : undefined}
			renderRightActions={renderRightActions}
			onSwipeableOpen={handleOpen}
			overshootLeft={false}
			overshootRight={false}
			friction={2}
			enabled={!!onAddToQueue || !!renderRightActions}
		>
			{children}
		</Swipeable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		queueAction: {
			backgroundColor: theme.colors.primary,
			justifyContent: 'center',
			alignItems: 'center',
			width: QUEUE_ACTION_WIDTH,
			height: '100%',
		},
		queueText: {
			color: '#FFFFFF',
			fontSize: 12,
			fontWeight: '600',
			marginTop: 4,
		},
	});
