import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Text } from '@/shared/components/ui/Text';
import type { Theme } from '@/shared/theme/types';
import type { PolicySpan } from '@/features/legal/privacyPolicy/utils/privacyPolicyContent';

interface PolicyTextProps {
	spans: PolicySpan[];
	theme: Theme;
	style: StyleProp<TextStyle>;
	onOpenLink: (url: string) => void;
}

export function PolicyText({ spans, theme, style, onOpenLink }: PolicyTextProps) {
	return (
		<Text style={style}>
			{spans.map((span, index) => {
				if (typeof span === 'string') return span;
				if ('bold' in span) {
					return (
						<Text key={index} style={{ fontFamily: theme.typography.families.semibold }}>
							{span.bold}
						</Text>
					);
				}
				if ('code' in span) {
					return (
						<Text key={index} style={{ fontFamily: theme.typography.families.medium }}>
							{span.code}
						</Text>
					);
				}
				return (
					<Text
						key={index}
						accessibilityRole="link"
						onPress={() => onOpenLink(span.url)}
						style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}
					>
						{span.link}
					</Text>
				);
			})}
		</Text>
	);
}
