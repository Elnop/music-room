import React from 'react';
import { StyleSheet } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { PolicySpan } from '@/features/legal/policyTypes';
import { policyKey } from '@/features/legal/policyKey';
import { PolicySpanText } from '@/features/legal/components/presenters/PolicySpanText';

type PolicyTextProps = {
	spans: PolicySpan[];
	style?: StyleProp<TextStyle>;
	onOpenLink: (url: string) => void;
};

export function PolicyText({ spans, style, onOpenLink }: PolicyTextProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Text style={[styles.paragraph, style]}>
			{spans.map((span) => (
				<PolicySpanText key={policyKey(span)} span={span} onOpenLink={onOpenLink} />
			))}
		</Text>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		paragraph: {
			fontSize: theme.typography.sizes.md,
			lineHeight: theme.typography.lineHeights.md,
			color: theme.colors.text,
		},
	});
	return styles;
}
