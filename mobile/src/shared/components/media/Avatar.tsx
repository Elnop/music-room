import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Text } from '@/shared/components/ui/Text';
import { sizedAvatarUri } from '@/shared/utils/avatarUri';
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
	const fontSize = {
		sm: theme.typography.sizes.xs,
		md: theme.typography.sizes.md,
		lg: theme.typography.sizes.xl,
		xl: theme.typography.sizes.xxxl,
	}[size];

	const getInitials = (name?: string): string => {
		if (!name) return '?';
		const parts = name.trim().split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	};

	return (
		<View
			style={[
				styles.container,
				{
					width: dimension,
					height: dimension,
					borderRadius: dimension / 2,
				},
				style,
			]}
		>
			{/* The initials stay until the photo has loaded, and come back when it cannot. */}
			{loaded !== photo && <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>}
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
			color: theme.colors.text,
			fontFamily: theme.typography.families.bold,
		},
	});
