import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { PolicySpan } from '@/features/legal/policyTypes';

type PolicySpanTextProps = {
	span: PolicySpan;
	onOpenLink: (url: string) => void;
};

export function PolicySpanText({ span, onOpenLink }: PolicySpanTextProps) {
	const { styles } = useThemedStyles(createStyles);

	if (typeof span === 'string') return span;
	if ('bold' in span) return <Text style={styles.bold}>{span.bold}</Text>;
	if ('code' in span) return <Text style={styles.code}>{span.code}</Text>;
	return (
		<Text accessibilityRole="link" onPress={() => onOpenLink(span.url)} style={styles.link}>
			{span.link}
		</Text>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		bold: { fontFamily: theme.typography.families.semibold },
		code: { fontFamily: theme.typography.families.medium },
		link: { color: theme.colors.primary, textDecorationLine: 'underline' },
	});
	return styles;
}
