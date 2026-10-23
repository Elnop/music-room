import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { VisibilityLevel } from '@/types/user.types';
import { VISIBILITY_ICONS, VISIBILITY_LABELS } from '@/types/user.types';

interface VisibilityToggleProps {
	label: string;
	description?: string;
	value: VisibilityLevel;
	onChange: (value: VisibilityLevel) => void;
}

const VISIBILITY_OPTIONS: VisibilityLevel[] = ['public', 'friends_only', 'private'];

export function VisibilityToggle({ label, description, value, onChange }: VisibilityToggleProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.toggleGroup}>
			<View style={styles.labelBlock}>
				<Text style={styles.label}>{label}</Text>
				{description && <Text style={styles.description}>{description}</Text>}
			</View>

			<View style={styles.options}>
				{VISIBILITY_OPTIONS.map(option => {
					const isSelected = value === option;
					return (
						<Pressable
							key={option}
							style={[styles.option, isSelected && styles.optionSelected]}
							onPress={() => onChange(option)}
							accessibilityLabel={VISIBILITY_LABELS[option]}
						>
							<Ionicons
								name={VISIBILITY_ICONS[option]}
								size={14}
								color={isSelected ? theme.colors.textInverse : theme.colors.textSecondary}
							/>
							<Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
								{VISIBILITY_LABELS[option]}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		toggleGroup: {
			marginBottom: theme.spacing.lg,
		},
		labelBlock: {
			marginBottom: theme.spacing.sm,
		},
		label: {
			fontSize: 16,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
		description: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		options: {
			flexDirection: 'row',
			backgroundColor: theme.colors.surface,
			borderRadius: 12,
			padding: 4,
			gap: 4,
		},
		option: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			paddingVertical: 10,
			paddingHorizontal: 8,
			borderRadius: 8,
			gap: 4,
		},
		optionSelected: {
			backgroundColor: theme.colors.primary,
		},
		optionLabel: {
			fontSize: 12,
			fontWeight: theme.typography.weights.medium,
			color: theme.colors.textSecondary,
		},
		optionLabelSelected: {
			color: theme.colors.textInverse,
		},
	});
