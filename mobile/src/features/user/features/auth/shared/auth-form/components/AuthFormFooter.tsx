import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type AuthFormFooterProps = {
	text: string;
	link: string;
	onLink: () => void;
};

export function AuthFormFooter({ text, link, onLink }: AuthFormFooterProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.footer}>
			<Text style={styles.footerText}>{text}</Text>
			<Text style={styles.footerLink} onPress={onLink}>
				{link}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		footer: {
			flexDirection: 'row',
			justifyContent: 'center',
			marginTop: theme.spacing.xl,
		},
		footerText: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		footerLink: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.primary,
			fontFamily: theme.typography.families.semibold,
		},
	});
	return styles;
}
