import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { PlaylistChoice } from '@/features/events/types';
import { FieldLabel } from './FieldLabel';

interface PlaylistSelectorProps {
	playlists: PlaylistChoice[];
	selectedId: string | null;
	onSelect: (id: string | null) => void;
}

export function PlaylistSelector({ playlists, selectedId, onSelect }: PlaylistSelectorProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const options = [{ id: null, name: 'Aucune' }, ...playlists];

	return (
		<View>
			<FieldLabel>Playlist liée (facultative)</FieldLabel>
			{playlists.length === 0 && (
				<Text style={styles.hint}>Seules vos playlists publiques peuvent être liées.</Text>
			)}
			<View style={styles.list}>
				{options.map(option => {
					const selected = option.id === selectedId;
					return (
						<Pressable
							key={option.id ?? 'none'}
							style={[styles.option, selected && styles.selected]}
							onPress={() => onSelect(option.id)}
							accessibilityRole="radio"
							accessibilityState={{ selected }}
							accessibilityLabel={`Playlist liée : ${option.name}`}
							haptic="selection"
						>
							<Ionicons
								name={selected ? 'radio-button-on' : 'radio-button-off'}
								size={18}
								color={selected ? theme.colors.primary : theme.colors.textSecondary}
							/>
							<Text style={styles.name} numberOfLines={1}>
								{option.name}
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
		hint: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.sm,
		},
		list: { gap: theme.spacing.xs },
		option: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
			borderRadius: 10,
			backgroundColor: theme.colors.surface,
		},
		selected: { backgroundColor: theme.colors.surfaceAlt },
		name: { flex: 1, fontSize: theme.typography.sizes.md, color: theme.colors.text },
	});
