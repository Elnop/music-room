import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type SnapCarouselProps = {
	itemWidth: number;
	children: React.ReactNode;
};

export function SnapCarousel({ itemWidth, children }: SnapCarouselProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.scrollContent}
			decelerationRate="fast"
			snapToInterval={itemWidth + theme.spacing.md}
		>
			{children}
		</ScrollView>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		scrollContent: {
			paddingHorizontal: theme.spacing.md,
			paddingBottom: theme.spacing.sm,
		},
	});
	return styles;
}
