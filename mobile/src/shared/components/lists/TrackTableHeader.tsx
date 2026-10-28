import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { useSeparatorColor } from '@/shared/hooks/useSeparatorColor';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Theme } from '@/shared/theme/types';
import { trackTableColumns as columns } from './trackTableLayout';
import { Text } from '@/shared/components/ui/Text';

/** The column titles above the rows of a track table (wide screens). */
export function TrackTableHeader() {
	const { styles, theme } = useThemedStyles(createStyles);
	const separator = useSeparatorColor();

	return (
		<View style={[styles.row, { borderBottomColor: separator }]}>
			<View style={columns.position}>
				<Text style={styles.label}>#</Text>
			</View>
			<View style={columns.title}>
				<Text style={styles.label}>Titre</Text>
			</View>
			<View style={columns.artist}>
				<Text style={styles.label}>Artiste</Text>
			</View>
			<View style={columns.duration}>
				<PixelIcon
					name="clock"
					size={16}
					color={theme.colors.textSecondary}
					accessibilityLabel="Durée"
				/>
			</View>
			<View style={columns.trailing} />
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 12,
			paddingVertical: theme.spacing.sm,
			borderBottomWidth: 1,
		},
		label: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.textSecondary,
		},
	});
