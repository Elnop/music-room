import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { useTheme } from '@/shared/theme/ThemeContext';
import { createUserProfileHeaderStyles } from './userProfileHeaderStyles';
import { Text } from '@/shared/components/ui/Text';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';

export function HiddenFieldNote({ label }: { label: string }) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createUserProfileHeaderStyles(theme), [theme]);

	return (
		<View style={styles.hiddenField}>
			<PixelIcon
				icon={LockSolid}
				size={16}
				color={theme.colors.textSecondary}
				style={styles.hiddenIcon}
			/>
			<Text style={styles.hiddenText}>{label}</Text>
		</View>
	);
}
