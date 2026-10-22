import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { ProfilePrivacy, VisibilityLevel } from '@/types/user.types';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { privacyApi } from '@/services/privacyApi';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { VisibilityToggle } from '@/components/profile/VisibilityToggle';
import { showError } from '@/shared/utils/toast';

export function PrivacySettingsScreen() {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
	const { accessToken } = useAuthStore();

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [privacy, setPrivacy] = useState<ProfilePrivacy | null>(null);
	const [initialPrivacy, setInitialPrivacy] = useState<ProfilePrivacy | null>(null);

	// Load privacy settings on mount
	useEffect(() => {
		const loadPrivacySettings = async () => {
			if (!accessToken) return;

			try {
				setIsLoading(true);
				const data = await privacyApi.getPrivacySettings(accessToken);
				setPrivacy(data);
				setInitialPrivacy(data);
			} catch (error) {
				const message = apiErrorMessage(
					error,
					'Impossible de charger les paramètres de confidentialité'
				);
				showError(message);
			} finally {
				setIsLoading(false);
			}
		};

		loadPrivacySettings();
	}, [accessToken]);

	const handleVisibilityChange = (field: keyof ProfilePrivacy, value: VisibilityLevel) => {
		if (!privacy) return;

		setPrivacy({
			...privacy,
			[field]: value,
		});
	};

	const hasChanges = React.useMemo(() => {
		if (!privacy || !initialPrivacy) return false;
		return (
			privacy.emailVisibility !== initialPrivacy.emailVisibility ||
			privacy.bioVisibility !== initialPrivacy.bioVisibility ||
			privacy.avatarVisibility !== initialPrivacy.avatarVisibility ||
			privacy.musicPreferencesVisibility !== initialPrivacy.musicPreferencesVisibility
		);
	}, [privacy, initialPrivacy]);

	// Set right before the post-save goBack: only that exit skips the guard. The guard stays
	// on while the save runs, so a back press then still asks and a failed save keeps guarding.
	const savedRef = useRef(false);

	usePreventRemove(hasChanges, ({ data }) => {
		if (savedRef.current) {
			navigation.dispatch(data.action);
			return;
		}
		Alert.alert(
			'Quitter sans enregistrer ?',
			'Vos modifications de confidentialité seront perdues.',
			[
				{ text: 'Annuler', style: 'cancel' },
				{
					text: 'Quitter sans enregistrer',
					style: 'destructive',
					onPress: () => navigation.dispatch(data.action),
				},
			]
		);
	});

	const handleSave = async () => {
		if (!accessToken || !privacy) return;

		try {
			setIsSaving(true);
			await privacyApi.updatePrivacySettings(accessToken, {
				emailVisibility: privacy.emailVisibility,
				bioVisibility: privacy.bioVisibility,
				avatarVisibility: privacy.avatarVisibility,
				musicPreferencesVisibility: privacy.musicPreferencesVisibility,
			});
			savedRef.current = true;
			setInitialPrivacy(privacy);
			navigation.goBack();
		} catch (error) {
			const message = apiErrorMessage(
				error,
				"Impossible d'enregistrer les paramètres de confidentialité"
			);
			showError(message);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return <LoadingSpinner fullScreen message="Chargement…" />;
	}

	if (!privacy) {
		return (
			<View style={styles.container}>
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>Impossible de charger les paramètres</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[styles.content, { paddingBottom: playerHeight + theme.spacing.xl }]}
			>
				<View style={styles.header}>
					<Text style={styles.subtitle}>Choisissez qui peut voir vos informations</Text>
				</View>

				<View style={styles.settings}>
					<VisibilityToggle
						label="Photo de profil"
						description="Qui peut voir votre photo"
						value={privacy.avatarVisibility}
						onChange={value => handleVisibilityChange('avatarVisibility', value)}
					/>

					<VisibilityToggle
						label="Adresse email"
						description="Qui peut voir votre email"
						value={privacy.emailVisibility}
						onChange={value => handleVisibilityChange('emailVisibility', value)}
					/>

					<VisibilityToggle
						label="Bio"
						description="Qui peut voir votre bio"
						value={privacy.bioVisibility}
						onChange={value => handleVisibilityChange('bioVisibility', value)}
					/>

					<VisibilityToggle
						label="Préférences musicales"
						description="Qui peut voir vos genres préférés"
						value={privacy.musicPreferencesVisibility}
						onChange={value => handleVisibilityChange('musicPreferencesVisibility', value)}
					/>
				</View>
				<Button
					variant="primary"
					onPress={handleSave}
					loading={isSaving}
					disabled={!hasChanges || isSaving}
				>
					Enregistrer
				</Button>
			</ScrollView>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		scrollView: {
			flex: 1,
		},
		content: {
			padding: theme.spacing.lg,
		},
		header: {
			marginBottom: theme.spacing.xl,
		},
		subtitle: {
			fontSize: 16,
			color: theme.colors.textSecondary,
		},
		settings: {
			marginBottom: theme.spacing.xl,
		},
		footer: {
			padding: theme.spacing.lg,
			borderTopWidth: 1,
			borderTopColor: theme.colors.border,
		},
		errorContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: theme.spacing.xl,
		},
		errorText: {
			fontSize: 16,
			color: theme.colors.error,
			textAlign: 'center',
		},
	});
