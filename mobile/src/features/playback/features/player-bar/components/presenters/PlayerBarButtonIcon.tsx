import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';

type PlayerBarButtonIconProps = {
	icon: PixelIconSource;
	color: string;
	state: { disabled: boolean; busy: boolean };
};

export function PlayerBarButtonIcon({ icon, color, state }: PlayerBarButtonIconProps) {
	if (state.busy) return <ActivityIndicator size="small" color={color} />;
	return (
		<PixelIcon
			icon={icon}
			size={20}
			color={color}
			style={state.disabled ? styles.disabledIcon : undefined}
		/>
	);
}

const styles = StyleSheet.create({
	disabledIcon: { opacity: 0.35 },
});
