import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import TimesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/times-solid.svg';

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

type SearchBarTrailingProps = {
	value: string;
	loading: boolean;
	onClear: () => void;
};

export function SearchBarTrailing({ value, loading, onClear }: SearchBarTrailingProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	return (
		<>
			{loading && (
				<ActivityIndicator
					size="small"
					color={theme.colors.textSecondary}
					style={styles.trailing}
					testID="search-bar-loading"
				/>
			)}
			{value.length > 0 && (
				<Pressable
					onPress={onClear}
					hitSlop={HIT_SLOP}
					style={styles.trailing}
					accessibilityLabel="Effacer la recherche"
				>
					<PixelIcon icon={TimesSolid} size={20} color={theme.colors.textSecondary} />
				</Pressable>
			)}
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		trailing: {
			marginLeft: theme.spacing.sm,
		},
	});
	return styles;
}
