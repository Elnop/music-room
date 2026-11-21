import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PlaylistChoice } from '@/features/events/lib/types';
import { FieldLabel } from '@/features/events/features/event-form/components/presenters/FieldLabel';
import { Text } from '@/shared/theme/components/Text';
import BracketSquareOutline from '@hackernoon/pixel-icon-library/icons/SVG/regular/bracket-square.svg';
import CheckBoxSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/check-box-solid.svg';

type PlaylistSelectorProps = {
	playlists: PlaylistChoice[];
	selectedId: string | null;
	onSelect: (id: string | null) => void;
};

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
							<PixelIcon
								icon={selected ? CheckBoxSolid : BracketSquareOutline}
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

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
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
			backgroundColor: theme.colors.surface,
		},
		selected: { backgroundColor: theme.colors.surfaceAlt },
		name: { flex: 1, fontSize: theme.typography.sizes.md, color: theme.colors.text },
	});
	return styles;
}
