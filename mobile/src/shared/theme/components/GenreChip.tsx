import React from 'react';
import { GenreChipBody } from '@/shared/theme/components/GenreChipBody';
import { Pressable } from '@/shared/theme/components/Pressable';
import { GENRE_INFO } from '@/shared/theme/configs/genresConfig';
import type { GenreChipSize } from '@/shared/theme/types/genreChipTypes';
import type { MusicGenre } from '@/shared/users/userTypes';

type GenreChipProps = {
	genre: MusicGenre;
	selected?: boolean;
	disabled?: boolean;
	onPress?: () => void;
	size?: GenreChipSize;
};

export function GenreChip({
	genre,
	selected = false,
	disabled = false,
	onPress,
	size = 'md',
}: GenreChipProps) {
	const body = <GenreChipBody genre={genre} selected={selected} disabled={disabled} size={size} />;

	if (onPress && !disabled) {
		return (
			<Pressable
				onPress={onPress}
				accessibilityRole="button"
				accessibilityLabel={GENRE_INFO[genre].label}
			>
				{body}
			</Pressable>
		);
	}

	return body;
}
