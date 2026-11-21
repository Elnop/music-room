import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import { Text } from '@/shared/theme/components/Text';
import { sizedAvatarUri } from '@/shared/theme/lib/avatarUri';
import { avatarColor, avatarInitials } from '@/shared/theme/lib/avatarInitials';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import { AvatarPhoto } from '@/shared/theme/components/AvatarPhoto';

interface AvatarProps {
	uri?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	name?: string;
	style?: StyleProp<ViewStyle>;
}

const SIZE_MAP = {
	sm: 32,
	md: 48,
	lg: 80,
	xl: 128,
};

export function Avatar({ uri, size = 'md', name, style }: AvatarProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const dimension = SIZE_MAP[size];
	const source = uri ? sizedAvatarUri(uri, dimension) : undefined;
	const [loaded, setLoaded] = React.useState<string | null>(null);
	const [failed, setFailed] = React.useState<string | null>(null);
	const photo = source && failed !== source ? source : undefined;
	const initials = avatarInitials(name);
	const { fontSize } = displayText(
		theme,
		dimension * (initials.length > 1 ? 0.38 : 0.44),
		'initials'
	);
	const background = name?.trim() ? { backgroundColor: avatarColor(name.trim()) } : undefined;

	return (
		<View
			style={[
				styles.container,
				{
					width: dimension,
					height: dimension,
				},
				background,
				style,
			]}
		>
			{loaded !== photo && <Text style={[styles.initials, { fontSize }]}>{initials}</Text>}
			{photo && (
				<AvatarPhoto
					uri={photo}
					size={dimension}
					onLoad={() => setLoaded(photo)}
					onError={() => setFailed(photo)}
				/>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		container: {
			backgroundColor: theme.colors.surfaceAlt,
			justifyContent: 'center',
			alignItems: 'center',
			overflow: 'hidden',
			borderWidth: theme.borders.medium,
			borderColor: theme.colors.border,
		},
		initials: {
			color: theme.colors.onColor,
			fontFamily: theme.typography.families.display,
		},
	});
}
