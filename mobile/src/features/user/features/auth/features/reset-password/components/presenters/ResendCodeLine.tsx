import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type ResendCodeLineProps = {
	cooldown: number;
	disabled: boolean;
	onResend: () => void;
};

export function ResendCodeLine({ cooldown, disabled, onResend }: ResendCodeLineProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.resendContainer}>
			<Text style={styles.resendText}>Code non reçu ? </Text>
			{cooldown === 0 ? (
				<Pressable onPress={onResend} disabled={disabled} accessibilityLabel="Renvoyer le code">
					<Text style={styles.resendLink}>Renvoyer le code</Text>
				</Pressable>
			) : (
				<Text style={styles.resendCooldown}>Renvoyer dans {cooldown} s</Text>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const text = { fontSize: theme.typography.sizes.md };
	const styles = StyleSheet.create({
		resendContainer: {
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			marginTop: theme.spacing.lg,
		},
		resendText: { ...text, color: theme.colors.textSecondary },
		resendLink: {
			...text,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.primary,
		},
		resendCooldown: { ...text, fontStyle: 'italic', color: theme.colors.textSecondary },
	});
	return styles;
}
