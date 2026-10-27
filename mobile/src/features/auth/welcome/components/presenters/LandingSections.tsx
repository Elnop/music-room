import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/shared/components/ui/Button';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';
import {
	CONTACT_EMAIL,
	CONTACT_MAILTO,
	LATEST_RELEASE_URL,
	SOURCE_CODE_URL,
} from '@/shared/constants/links';
import { CONTENT_MAX_WIDTH } from '@/shared/constants/layout';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Theme } from '@/shared/theme/types';
import { LANDING_FEATURES } from '@/features/auth/welcome/utils/landingContent';
import { FeatureCard } from './FeatureCard';

interface LandingSectionsProps {
	buildLabel: string;
	onOpenPrivacyPolicy: () => void;
	onOpenLink: (url: string) => void;
}

export function LandingSections({
	buildLabel,
	onOpenPrivacyPolicy,
	onOpenLink,
}: LandingSectionsProps) {
	const { styles } = useThemedStyles(createStyles);
	const { isWide, isDesktop } = useBreakpoint();
	const columns = isDesktop ? 4 : isWide ? 2 : 1;
	const rows = Array.from({ length: Math.ceil(LANDING_FEATURES.length / columns) }, (_, row) =>
		LANDING_FEATURES.slice(row * columns, (row + 1) * columns)
	);

	return (
		<View style={styles.sections}>
			<View style={styles.section}>
				<Text style={styles.title} accessibilityRole="header">
					Fonctionnalités
				</Text>
				{rows.map(features => (
					<View key={features[0].title} style={styles.row}>
						{features.map(feature => (
							<FeatureCard key={feature.title} {...feature} />
						))}
					</View>
				))}
			</View>

			<View style={[styles.section, isWide && styles.row]}>
				<View style={[styles.panel, isWide && styles.flex]}>
					<Text style={styles.title} accessibilityRole="header">
						Télécharger
					</Text>
					<Text style={styles.body}>
						L'application Android est disponible dans la dernière version publiée sur GitHub.
					</Text>
					<Button
						title="Télécharger pour Android"
						variant="outline"
						onPress={() => onOpenLink(LATEST_RELEASE_URL)}
					/>
				</View>
				<View style={[styles.panel, isWide && styles.flex]}>
					<Text style={styles.title} accessibilityRole="header">
						Contact
					</Text>
					<Text style={styles.body}>Questions ou assistance :</Text>
					<Pressable
						accessibilityRole="link"
						accessibilityLabel={CONTACT_EMAIL}
						onPress={() => onOpenLink(CONTACT_MAILTO)}
					>
						<Text style={styles.link}>{CONTACT_EMAIL}</Text>
					</Pressable>
				</View>
			</View>

			<View style={styles.footer}>
				<View style={styles.footerLinks}>
					<Pressable
						accessibilityRole="link"
						accessibilityLabel="Politique de confidentialité"
						onPress={onOpenPrivacyPolicy}
					>
						<Text style={styles.footerLink}>Politique de confidentialité</Text>
					</Pressable>
					<Text style={styles.footerText}>·</Text>
					<Pressable
						accessibilityRole="link"
						accessibilityLabel="Code source"
						onPress={() => onOpenLink(SOURCE_CODE_URL)}
					>
						<Text style={styles.footerLink}>Code source</Text>
					</Pressable>
				</View>
				<Text style={styles.footerText}>{buildLabel}</Text>
			</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		// Centred without a background of its own: Welcome's floating icons show through.
		sections: {
			width: '100%',
			maxWidth: CONTENT_MAX_WIDTH.content,
			alignSelf: 'center',
			gap: theme.spacing.xl,
			paddingTop: theme.spacing.xl,
		},
		section: {
			gap: theme.spacing.md,
		},
		row: {
			flexDirection: 'row',
			gap: theme.spacing.md,
		},
		flex: {
			flex: 1,
		},
		panel: {
			gap: theme.spacing.md,
			padding: theme.spacing.lg,
			backgroundColor: theme.colors.surface,
			borderRadius: 16,
		},
		title: {
			fontSize: theme.typography.sizes.xl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		body: {
			fontSize: theme.typography.sizes.md,
			lineHeight: 20,
			color: theme.colors.textSecondary,
		},
		link: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.primary,
		},
		footer: {
			alignItems: 'center',
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.lg,
			borderTopWidth: StyleSheet.hairlineWidth,
			borderTopColor: theme.colors.borderSubtle,
		},
		footerLinks: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'center',
			gap: theme.spacing.sm,
		},
		footerLink: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			textDecorationLine: 'underline',
		},
		footerText: {
			fontSize: 12,
			color: theme.colors.textSecondary,
		},
	});
