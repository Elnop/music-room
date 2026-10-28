import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useShareLink } from '@/shared/hooks/useShareLink';
import { Text } from '@/shared/components/ui/Text';

interface ShareLinkButtonProps {
	url: string;
	/** Shown above the link in the message (playlist or user name). */
	title?: string;
	style?: StyleProp<ViewStyle>;
}

export function ShareLinkButton({ url, title, style }: ShareLinkButtonProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const handlePress = useShareLink(url, title);

	return (
		<Pressable style={[styles.button, style]} onPress={handlePress} accessibilityLabel="Partager">
			<Ionicons name="share-social-outline" size={16} color={theme.colors.text} />
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
