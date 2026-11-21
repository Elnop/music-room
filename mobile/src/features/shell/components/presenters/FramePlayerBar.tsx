import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { useSeparatorColor } from '@/shared/theme/hooks/useSeparatorColor';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { Breakpoint } from '@/shared/theme/types/layoutTypes';
import type { FramePlayerBars } from '@/features/shell/types/frameTypes';

type FramePlayerBarProps = {
	breakpoint: Breakpoint;
	bottomInset: number;
	bars: FramePlayerBars;
};

export function FramePlayerBar({ breakpoint, bottomInset, bars }: FramePlayerBarProps) {
	const { styles } = useThemedStyles(createStyles);
	const separator = useSeparatorColor();

	if (breakpoint === 'phone') return null;

	return (
		<View style={[styles.playerBar, edgeStyle(separator, bottomInset)]}>
			{breakpoint === 'desktop' ? bars.playerBar : bars.miniPlayer}
		</View>
	);
}

function edgeStyle(borderTopColor: string, paddingBottom: number): ViewStyle {
	return { borderTopColor, paddingBottom };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		playerBar: {
			borderTopWidth: theme.borders.hairline,
			backgroundColor: theme.colors.background,
		},
	});
	return styles;
}
