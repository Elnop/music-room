import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { showSuccess } from '@utils/toast';
import {
	DEFAULT_BACKEND_URL,
	getBackendUrl,
	onBackendUrlChange,
	resetBackendUrl,
	setBackendUrl,
} from '@/services/backendUrl';

/**
 * Edits the backend address used by the API clients and the socket
 * (services/backendUrl.ts). Used in Settings and on the Welcome screen.
 */
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
		showSuccess(`Backend address set to ${result.url}`);
	};

	const handleReset = async () => {
		setIsSaving(true);
		const url = await resetBackendUrl();
		setIsSaving(false);
		setError(undefined);
		setDraft(url);
		setCurrentUrl(url);
		showSuccess('Backend address reset to default');
	};

	return (
		<View>
			<Input
				label="Backend address"
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
			<Text style={styles.current}>Current: {currentUrl}</Text>
			<View style={styles.actions}>
				<Button
					title="Save"
					onPress={handleSave}
					loading={isSaving}
					disabled={draft.trim() === currentUrl}
					style={styles.action}
				/>
				<Button
					title="Reset to default"
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
