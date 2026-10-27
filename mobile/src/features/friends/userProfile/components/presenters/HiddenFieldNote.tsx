import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { createUserProfileHeaderStyles } from './userProfileHeaderStyles';
import { Text } from '@/shared/components/ui/Text';

/** Stands for a field the user's privacy settings hide from me. */
export function HiddenFieldNote({ label }: { label: string }) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createUserProfileHeaderStyles(theme), [theme]);

	return (
		<View style={styles.hiddenField}>
			<Ionicons
				name="lock-closed"
				size={16}
				color={theme.colors.textSecondary}
				style={styles.hiddenIcon}
			/>
			<Text style={styles.hiddenText}>{label}</Text>
		</View>
	);
}
