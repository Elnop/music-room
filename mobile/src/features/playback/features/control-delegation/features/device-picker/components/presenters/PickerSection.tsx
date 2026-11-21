import React from 'react';
import { StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { pixelCaption } from '@/shared/theme/lib/pixelCaption';
import type { Theme } from '@/shared/theme/types/themeTypes';

type PickerSectionProps = {
	label: string;
	emptyText: string;
	children: ReactNode;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		sectionLabel: {
			paddingHorizontal: theme.spacing.md,
			paddingTop: theme.spacing.md,
			paddingBottom: theme.spacing.sm,
			...pixelCaption(theme),
		},
		emptyText: {
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}

export function PickerSection({ label, emptyText, children }: PickerSectionProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			<Text style={styles.sectionLabel}>{label}</Text>
			{children || <Text style={styles.emptyText}>{emptyText}</Text>}
		</>
	);
}
