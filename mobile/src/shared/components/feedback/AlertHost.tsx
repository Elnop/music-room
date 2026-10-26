import React from 'react';
import { Modal, StyleSheet, Text, View, type AlertButton } from 'react-native';
import { CenteredDialog } from '@/shared/components/layout/CenteredDialog';
import { dialogStyles } from '@/shared/components/layout/dialogStyles';
import { Button } from '@/shared/components/ui/Button';
import { useAlertStore } from '@/shared/stores/alertStore';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Theme } from '@/shared/theme/types';

const OK_BUTTON: AlertButton = { text: 'OK' };

/** Shows the alerts of showAlert in a browser; on native platforms the queue stays empty and it renders nothing. */
export function AlertHost() {
	const { styles } = useThemedStyles(createStyles);
	const alert = useAlertStore(state => state.queue[0]);
	const dismiss = useAlertStore(state => state.dismiss);

	if (!alert) return null;

	const buttons = alert.buttons.length > 0 ? alert.buttons : [OK_BUTTON];
	const choose = (button?: AlertButton) => {
		dismiss();
		button?.onPress?.();
	};
	// The backdrop and Escape act as the cancel button, when there is one.
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
