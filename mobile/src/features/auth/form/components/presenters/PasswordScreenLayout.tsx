import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { Text } from '@/shared/components/ui/Text';
import { FONT_FAMILIES } from '@/shared/theme/fonts';

interface PasswordScreenLayoutProps {
	title: string;
	subtitle: React.ReactNode;
	headerSpacing: number;
	children: React.ReactNode;
}

export function PasswordScreenLayout({
	title,
	subtitle,
	headerSpacing,
	children,
}: PasswordScreenLayoutProps) {
	const { theme } = useTheme();

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
				<View style={{ marginBottom: headerSpacing }}>
					<Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
					<Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
				</View>
				{children}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: 24,
		paddingTop: 60,
		paddingBottom: 32,
	},
	title: {
		fontSize: 32,
		fontFamily: FONT_FAMILIES.bold,
		marginBottom: 12,
	},
	subtitle: {
		fontSize: 16,
		lineHeight: 24,
	},
});
