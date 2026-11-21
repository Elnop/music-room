import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { SettingsSection } from '@/features/user/features/settings/components/presenters/SettingsSection';
import AngleRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/angle-right-solid.svg';

type AboutSectionProps = {
	onOpenPrivacyPolicy: () => void;
};

export function AboutSection({ onOpenPrivacyPolicy }: AboutSectionProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<SettingsSection title="À propos">
			<Pressable
				onPress={onOpenPrivacyPolicy}
				accessibilityLabel="Politique de confidentialité"
				style={styles.row}
			>
				<Text style={styles.rowLabel}>Politique de confidentialité</Text>
				<PixelIcon icon={AngleRightSolid} size={20} color={theme.colors.textSecondary} />
			</Pressable>
		</SettingsSection>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: theme.spacing.md,
		},
		rowLabel: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
	});
	return styles;
}
