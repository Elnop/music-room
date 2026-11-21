import React from 'react';
import { ActivityIndicator } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';

type KeyGlyphProps = {
	icon: PixelIconSource;
	size: number;
	color: string;
	loading?: boolean;
};

export function KeyGlyph({ icon, size, color, loading }: KeyGlyphProps) {
	if (loading) return <ActivityIndicator color={color} />;
	return <PixelIcon icon={icon} size={size} color={color} />;
}
