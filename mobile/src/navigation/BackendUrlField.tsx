import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import { Input } from '@/shared/theme/components/Input';
import { Button } from '@/shared/theme/components/Button';
import { showSuccess } from '@/shared/theme/lib/toast';
import {
	DEFAULT_BACKEND_URL,
	getBackendUrl,
	onBackendUrlChange,
	resetBackendUrl,
	setBackendUrl,
} from '@/shared/backend/lib/backendUrl';
import { Text } from '@/shared/theme/components/Text';

export function BackendUrlField() {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const [currentUrl, setCurrentUrl] = useState(getBackendUrl);
	const [draft, setDraft] = useState(getBackendUrl);
	const [error, setError] = useState<string | undefined>();
	const [isSaving, setIsSaving] = useState(false);

	useEffect(
		() =>
			onBackendUrlChange(url => {
				setCurrentUrl(url);
				setDraft(url);
			}),
		[]
	);

	const handleSave = async () => {
		setIsSaving(true);
		const result = await setBackendUrl(draft);
		setIsSaving(false);
		if ('error' in result) {
			setError(result.error);
			return;
		}
		setError(undefined);
		setDraft(result.url);
		setCurrentUrl(result.url);
		showSuccess(`Adresse du serveur : ${result.url}`);
	};

	const handleReset = async () => {
		setIsSaving(true);
		const url = await resetBackendUrl();
		setIsSaving(false);
		setError(undefined);
		setDraft(url);
		setCurrentUrl(url);
		showSuccess('Adresse du serveur par défaut rétablie');
	};

	return (
		<View>
			<Input
				label="Adresse du serveur"
				value={draft}
				onChangeText={text => {
					setDraft(text);
					if (error) setError(undefined);
				}}
				placeholder={DEFAULT_BACKEND_URL}
				error={error}
				autoCapitalize="none"
				autoCorrect={false}
				keyboardType="url"
				onSubmitEditing={handleSave}
				returnKeyType="done"
			/>
			<Text style={styles.current}>Actuelle : {currentUrl}</Text>
			<View style={styles.actions}>
				<Button
					title="Enregistrer"
					onPress={handleSave}
					loading={isSaving}
					disabled={draft.trim() === currentUrl}
					style={styles.action}
				/>
				<Button
					title="Rétablir par défaut"
					onPress={handleReset}
					variant="outline"
					disabled={isSaving || currentUrl === DEFAULT_BACKEND_URL}
					style={styles.action}
				/>
			</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		current: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.sm,
		},
		actions: {
			flexDirection: 'row',
			gap: theme.spacing.sm,
		},
		action: {
			flex: 1,
		},
	});
