import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { PixelIcon } from './PixelIcon';
import { useTheme } from './ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import { Pressable } from './Pressable';
import { useShareLink } from '@/shared/theme/hooks/useShareLink';
import { Text } from './Text';
import ShareSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/share-solid.svg';

interface ShareLinkButtonProps {
	url: string;
	title?: string;
	style?: StyleProp<ViewStyle>;
}

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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		button: {
			flexDirection: 'row',
			alignItems: 'center',
			alignSelf: 'center',
			gap: theme.spacing.xs,
			paddingVertical: theme.spacing.xs,
			paddingHorizontal: theme.spacing.md,
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		label: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
	});
