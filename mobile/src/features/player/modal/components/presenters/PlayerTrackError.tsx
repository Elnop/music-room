import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import type { createStyles } from './playerModalStyles';
import { Text } from '@/shared/components/ui/Text';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';

interface PlayerTrackErrorProps {
	styles: ReturnType<typeof createStyles>;
	error: string | null;
	isRemote: boolean;
	colors: {
		error: string;
		errorBg: string;
	};
}

export function PlayerTrackError({ styles, error, isRemote, colors }: PlayerTrackErrorProps) {
	if (!error || isRemote) return null;
	return (
		<View style={[styles.errorContainer, { backgroundColor: colors.errorBg }]}>
			<PixelIcon icon={ExclamationTriangleSolid} size={16} color={colors.error} />
			<Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
		</View>
	);
}
