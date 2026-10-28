import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Text } from '@/shared/components/ui/Text';
import { sizedAvatarUri } from '@/shared/utils/avatarUri';
import { avatarColor, avatarInitials } from '@/shared/utils/avatarInitials';
import { AvatarPhoto } from './AvatarPhoto';

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
	// Initials fill about 40% of the circle, the usual ratio for letter avatars.
	const fontSize = Math.round(dimension * (initials.length > 1 ? 0.38 : 0.44));
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
			{/* The initials stay until the photo has loaded, and come back when it cannot. */}
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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
			fontFamily: theme.typography.families.semibold,
		},
	});
