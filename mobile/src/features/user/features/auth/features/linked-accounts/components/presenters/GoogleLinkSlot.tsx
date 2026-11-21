import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { GoogleButtonSlot } from '@/features/user/features/auth/authTypes';

type GoogleLinkSlotProps = {
	slot: GoogleButtonSlot;
	disabled: boolean;
};

export function GoogleLinkSlot({ slot, disabled }: GoogleLinkSlotProps) {
	return <View ref={slot} style={disabled && styles.disabled} testID="google-button-slot" />;
}

const styles = StyleSheet.create({
	disabled: {
		opacity: 0.5,
		pointerEvents: 'none',
	},
});
