import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { keycap } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { MiniPlayerInfo } from '@/features/playback/features/mini-player/components/presenters/MiniPlayerInfo';
import { MiniPlayerTransport } from '@/features/playback/features/mini-player/components/presenters/MiniPlayerTransport';
import type { MiniPlayerData } from '@/features/playback/features/mini-player/miniPlayerTypes';

type MiniPlayerViewProps = {
	data: MiniPlayerData;
};

function progressWidth(progress: number): ViewStyle {
	return { width: `${progress}%` };
}

export function MiniPlayerView({ data }: MiniPlayerViewProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={styles.container}
			onPress={data.onToggleModal}
			accessible={false}
			accessibilityRole="none"
			accessibilityLabel="Mini-lecteur"
		>
			<View style={styles.progressBarContainer}>
				<View style={[styles.progressBar, progressWidth(data.progress)]} />
			</View>
			<View style={styles.content}>
				<Animated.View style={[styles.swipeArea, data.infoStyle]}>
					<MiniPlayerInfo data={data} />
				</Animated.View>
				<MiniPlayerTransport data={data} />
			</View>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			...keycap(theme),
			backgroundColor: theme.colors.surfaceAlt,
			marginHorizontal: theme.spacing.md,
			marginBottom: theme.spacing.sm,
		},
		content: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: theme.spacing.sm,
			paddingRight: theme.spacing.md,
		},
		swipeArea: { flex: 1 },
		progressBarContainer: {
			height: theme.borders.thick,
			width: '100%',
			backgroundColor: 'transparent',
		},
		progressBar: { height: theme.borders.thick, backgroundColor: theme.colors.primary },
	});
	return styles;
}
