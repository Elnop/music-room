import React from 'react';
import { Modal, StyleSheet, View, type AlertButton } from 'react-native';
import { CenteredDialog } from '@/shared/theme/components/CenteredDialog';
import { dialogStyles } from '@/features/shell/lib/dialogStyles';
import { Button } from '@/shared/theme/components/Button';
import { useAlertStore } from '@/shared/alerts/alertStore';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/lib/types';
import { Text } from '@/shared/theme/components/Text';

const OK_BUTTON: AlertButton = { text: 'OK' };

export function AlertHostContainer() {
	const { styles } = useThemedStyles(createStyles);
	const alert = useAlertStore(state => state.queue[0]);
	const dismiss = useAlertStore(state => state.dismiss);

	if (!alert) return null;

	const buttons = alert.buttons.length > 0 ? alert.buttons : [OK_BUTTON];
	const choose = (button?: AlertButton) => {
		dismiss();
		button?.onPress?.();
	};
	const cancel = () => choose(buttons.find(button => button.style === 'cancel'));

	return (
		<Modal visible transparent animationType="fade" onRequestClose={cancel}>
			<CenteredDialog onClose={cancel}>
				<View style={styles.body} accessibilityRole="alert">
					<Text style={styles.title}>{alert.title}</Text>
					{alert.message !== '' && <Text style={styles.message}>{alert.message}</Text>}
					<View style={styles.buttons}>
						{buttons.map((button, index) => (
							<Button
								key={`${button.text ?? ''}-${index}`}
								title={button.text ?? 'OK'}
								variant={button.style === 'cancel' ? 'secondary' : 'primary'}
								style={button.style === 'destructive' ? styles.destructive : undefined}
								onPress={() => choose(button)}
							/>
						))}
					</View>
				</View>
			</CenteredDialog>
		</Modal>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		...dialogStyles(theme),
		message: {
			marginTop: theme.spacing.sm,
			fontSize: theme.typography.sizes.lg,
			color: theme.colors.textSecondary,
		},
		buttons: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'flex-end',
			gap: theme.spacing.sm,
			marginTop: theme.spacing.lg,
		},
		destructive: { backgroundColor: theme.colors.error },
	});
