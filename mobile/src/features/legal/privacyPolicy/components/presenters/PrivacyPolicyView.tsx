import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/shared/components/ui/Text';
import type { Theme } from '@/shared/theme/types';
import {
	POLICY_INTRO,
	POLICY_SECTIONS,
	POLICY_UPDATED_AT,
} from '@/features/legal/privacyPolicy/utils/privacyPolicyContent';
import { PolicyText } from './PolicyText';

interface PrivacyPolicyViewProps {
	theme: Theme;
	bottomPadding: number;
	onOpenLink: (url: string) => void;
}

export function PrivacyPolicyView({ theme, bottomPadding, onOpenLink }: PrivacyPolicyViewProps) {
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
		>
			<Text style={styles.updatedAt}>{POLICY_UPDATED_AT}</Text>
			<PolicyText
				spans={POLICY_INTRO}
				theme={theme}
				style={styles.paragraph}
				onOpenLink={onOpenLink}
			/>

			{POLICY_SECTIONS.map(section => (
				<View key={section.title} style={styles.section}>
					<Text style={styles.title} accessibilityRole="header">
						{section.title}
					</Text>
					{section.blocks.map((block, blockIndex) =>
						'paragraph' in block ? (
							<PolicyText
								key={blockIndex}
								spans={block.paragraph}
								theme={theme}
								style={styles.paragraph}
								onOpenLink={onOpenLink}
							/>
						) : (
							<View key={blockIndex} style={styles.list}>
								{block.list.map((item, itemIndex) => (
									<View key={itemIndex} style={styles.item}>
										<Text style={styles.bullet}>•</Text>
										<PolicyText
											spans={item}
											theme={theme}
											style={[styles.paragraph, styles.itemText]}
											onOpenLink={onOpenLink}
										/>
									</View>
								))}
							</View>
						)
					)}
				</View>
			))}
		</ScrollView>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		content: {
			padding: theme.spacing.md,
			gap: theme.spacing.md,
		},
		updatedAt: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		section: {
			gap: theme.spacing.sm,
			marginTop: theme.spacing.sm,
		},
		title: {
			fontSize: theme.typography.sizes.xl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		paragraph: {
			fontSize: theme.typography.sizes.md,
			lineHeight: 21,
			color: theme.colors.text,
		},
		list: {
			gap: theme.spacing.sm,
		},
		item: {
			flexDirection: 'row',
			gap: theme.spacing.sm,
		},
		bullet: {
			fontSize: theme.typography.sizes.md,
			lineHeight: 21,
			color: theme.colors.textSecondary,
		},
		itemText: {
			flex: 1,
		},
	});
