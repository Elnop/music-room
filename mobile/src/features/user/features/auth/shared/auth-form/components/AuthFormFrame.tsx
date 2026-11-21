import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { AuthFormSetup } from '@/features/user/features/auth/shared/auth-form/authFormTypes';
import { AuthFormBody } from '@/features/user/features/auth/shared/auth-form/components/AuthFormBody';

type AuthFormFrameProps = {
	bottomInset?: number;
	setup: AuthFormSetup;
	onFooterLink: () => void;
	children: React.ReactNode;
};

function bottomInsetStyle(bottomInset: number | undefined): ViewStyle | undefined {
	return bottomInset === undefined ? undefined : { paddingBottom: bottomInset };
}

export function AuthFormFrame({ bottomInset, children, ...body }: AuthFormFrameProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.container}>
			<KeyboardAvoidingView
				style={styles.keyboardAvoid}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<ScrollView
					contentContainerStyle={[styles.scrollContent, bottomInsetStyle(bottomInset)]}
					keyboardShouldPersistTaps="handled"
					bounces={false}
					showsVerticalScrollIndicator={false}
				>
					<AuthFormBody {...body}>{children}</AuthFormBody>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		keyboardAvoid: {
			flex: 1,
		},
		scrollContent: {
			flexGrow: 1,
		},
	});
	return styles;
}
