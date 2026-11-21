import React from 'react';
import { StyleSheet } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { EmptyStateAction } from '@/shared/theme/types/emptyStateTypes';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type DeviceEmptyStateProps = {
	message: string;
	icon?: PixelIconSource;
	action?: EmptyStateAction;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		emptyState: { flex: 0, padding: theme.spacing.md },
	});
	return styles;
}

export function DeviceEmptyState({ message, icon, action }: DeviceEmptyStateProps) {
	const { styles } = useThemedStyles(createStyles);
	return <EmptyState icon={icon} style={styles.emptyState} message={message} action={action} />;
}
