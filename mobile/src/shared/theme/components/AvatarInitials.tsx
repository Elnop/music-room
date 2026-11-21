import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { avatarInitials } from '@/shared/theme/lib/avatarInitials';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';

type AvatarInitialsProps = {
	name?: string;
	dimension: number;
};

export function AvatarInitials({ name, dimension }: AvatarInitialsProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const initials = avatarInitials(name);
	const ratio = initials.length > 1 ? 0.38 : 0.44;
	return (
		<Text style={[styles.initials, displayText(theme, dimension * ratio, 'initials')]}>
			{initials}
		</Text>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		initials: {
			color: theme.colors.onColor,
			fontFamily: theme.typography.families.display,
		},
	});
	return styles;
}
