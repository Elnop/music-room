import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelWordmark } from '@/shared/theme/components/PixelWordmark';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { AuthFormSetup } from '@/features/user/features/auth/shared/auth-form/authFormTypes';
import { AuthFormFooter } from '@/features/user/features/auth/shared/auth-form/components/AuthFormFooter';

type AuthFormBodyProps = {
	setup: AuthFormSetup;
	onFooterLink: () => void;
	children: React.ReactNode;
};

export function AuthFormBody({ setup, onFooterLink, children }: AuthFormBodyProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.content}>
			<View style={styles.header}>
				<PixelWordmark size={Math.round(setup.logoSize / 5)} />
			</View>
			<View style={styles.form}>{children}</View>
			<AuthFormFooter {...setup.footer} onLink={onFooterLink} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		content: {
			flex: 1,
			padding: theme.spacing.lg,
			justifyContent: 'center',
		},
		header: {
			alignItems: 'center',
			marginBottom: theme.spacing.xl,
		},
		form: {
			gap: theme.spacing.md,
		},
	});
	return styles;
}
