import React from 'react';
import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useShareLink } from '@/shared/theme/hooks/useShareLink';
import { Text } from '@/shared/theme/components/Text';
import ShareSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/share-solid.svg';

type ShareLinkButtonProps = {
	url: string;
	title?: string;
	style?: StyleProp<ViewStyle>;
};

export function ShareLinkButton({ url, title, style }: ShareLinkButtonProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const handlePress = useShareLink(url, title);

	return (
		<Pressable style={[styles.button, style]} onPress={handlePress} accessibilityLabel="Partager">
			<PixelIcon icon={ShareSolid} size={16} color={theme.colors.text} />
			<Text style={styles.label}>Partager</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		button: {
			flexDirection: 'row',
			alignItems: 'center',
			alignSelf: 'center',
			gap: theme.spacing.xs,
			paddingVertical: theme.spacing.xs,
			paddingHorizontal: theme.spacing.md,
			borderWidth: theme.borders.hairline,
			borderColor: theme.colors.border,
		},
		label: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
	});
	return styles;
}
