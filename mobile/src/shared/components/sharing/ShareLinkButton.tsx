import React from 'react';
import { Share, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Pressable } from '@/shared/components/ui/Pressable';
import { showError } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';

interface ShareLinkButtonProps {
	url: string;
	/** Shown above the link in the message (playlist or user name). */
	title?: string;
	style?: StyleProp<ViewStyle>;
}

/** No success toast: the sheet is the feedback, and Android reports a dismissal as sharedAction. */
export function ShareLinkButton({ url, title, style }: ShareLinkButtonProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const handlePress = async () => {
		try {
			await Share.share({ message: title ? `${title}\n${url}` : url, title });
		} catch (error) {
			logger.error('[ShareLinkButton] Share failed:', error);
			showError('Impossible de partager ce lien');
		}
	};

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
			borderRadius: 999,
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		label: {
			fontSize: theme.typography.sizes.sm,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
	});
