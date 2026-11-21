import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PasswordScreenHeader } from '@/features/user/features/auth/shared/password-screen/components/PasswordScreenHeader';

type PasswordScreenFrameProps = {
	title: string;
	subtitle: string;
	emphasis?: string;
	compactHeader?: boolean;
	children: React.ReactNode;
};

export function PasswordScreenFrame({
	title,
	subtitle,
	emphasis,
	compactHeader = false,
	children,
}: PasswordScreenFrameProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
				<PasswordScreenHeader
					title={title}
					subtitle={subtitle}
					emphasis={emphasis}
					compact={compactHeader}
				/>
				{children}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		scrollContent: {
			flexGrow: 1,
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.xxxl,
			paddingBottom: theme.spacing.xl,
		},
	});
	return styles;
}
