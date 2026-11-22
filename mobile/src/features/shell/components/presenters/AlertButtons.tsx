import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { AlertButton } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type AlertButtonsProps = {
	buttons: AlertButton[];
	onChoose: (button: AlertButton) => void;
};

export function AlertButtons({ buttons, onChoose }: AlertButtonsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.buttons}>
			{buttons.map((button) => (
				<Button
					key={`${button.style ?? 'default'}-${button.text ?? 'OK'}`}
					title={button.text ?? 'OK'}
					variant={button.style === 'cancel' ? 'secondary' : 'primary'}
					style={button.style === 'destructive' ? styles.destructive : undefined}
					onPress={() => onChoose(button)}
				/>
			))}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		buttons: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'flex-end',
			gap: theme.spacing.sm,
			marginTop: theme.spacing.lg,
		},
		destructive: { backgroundColor: theme.colors.error },
	});
	return styles;
}
