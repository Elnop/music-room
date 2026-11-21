import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { useAvatarPhoto } from '@/shared/theme/hooks/useAvatarPhoto';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { avatarColor } from '@/shared/theme/lib/avatarInitials';
import { squareStyle } from '@/shared/theme/lib/squareStyle';
import { AvatarInitials } from '@/shared/theme/components/AvatarInitials';
import { AvatarPhoto } from '@/shared/theme/components/AvatarPhoto';

type AvatarProps = {
	uri?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	name?: string;
	style?: StyleProp<ViewStyle>;
};

const SIZE_MAP = {
	sm: 32,
	md: 48,
	lg: 80,
	xl: 128,
};

export function Avatar({ uri, size = 'md', name, style }: AvatarProps) {
	const { styles } = useThemedStyles(createStyles);
	const dimension = SIZE_MAP[size];
	const photo = useAvatarPhoto(uri, dimension);

	return (
		<View style={[styles.container, squareStyle(dimension), nameBackground(name), style]}>
			{photo.showInitials && <AvatarInitials name={name} dimension={dimension} />}
			{photo.uri && (
				<AvatarPhoto
					uri={photo.uri}
					size={dimension}
					onLoad={photo.onLoad}
					onError={photo.onError}
				/>
			)}
		</View>
	);
}

function nameBackground(name?: string): ViewStyle | undefined {
	const trimmed = name?.trim();
	return trimmed ? { backgroundColor: avatarColor(trimmed) } : undefined;
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			backgroundColor: theme.colors.surfaceAlt,
			justifyContent: 'center',
			alignItems: 'center',
			overflow: 'hidden',
			borderWidth: theme.borders.medium,
			borderColor: theme.colors.border,
		},
	});
	return styles;
}
