import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { MusicGenre } from '@/types/user.types';
import { MAX_GENRES } from '@/types/user.types';
import { useAuthStore } from '@/store/authStore';
import { privacyApi } from '@/services/privacyApi';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { GenreSelector } from '@/components/profile/GenreSelector';
import { showError } from '@/shared/utils/toast';

export function MusicPreferencesScreen() {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
	const { accessToken } = useAuthStore();

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [initialGenres, setInitialGenres] = useState<MusicGenre[]>([]);
	const [selectedGenres, setSelectedGenres] = useState<MusicGenre[]>([]);

	// Load music preferences on mount
	useEffect(() => {
		const loadMusicPreferences = async () => {
			if (!accessToken) return;

			try {
				setIsLoading(true);
				const data = await privacyApi.getMusicPreferences(accessToken);
				const genres = data.genres || [];
				setInitialGenres(genres);
				setSelectedGenres(genres);
			} catch (error) {
				const message = apiErrorMessage(error, 'Impossible de charger vos préférences');
				showError(message);
			} finally {
				setIsLoading(false);
			}
		};

		loadMusicPreferences();
	}, [accessToken]);

	const handleGenreToggle = (genre: MusicGenre) => {
		const isSelected = selectedGenres.includes(genre);

		if (isSelected) {
			setSelectedGenres(selectedGenres.filter(g => g !== genre));
		} else if (selectedGenres.length < MAX_GENRES) {
			setSelectedGenres([...selectedGenres, genre]);
		}
	};

	const hasChanges = React.useMemo(() => {
		if (initialGenres.length !== selectedGenres.length) return true;
		const sortedInitial = [...initialGenres].sort();
		const sortedSelected = [...selectedGenres].sort();
		return !sortedInitial.every((g, i) => g === sortedSelected[i]);
	}, [initialGenres, selectedGenres]);

	const handleSave = async () => {
		if (!accessToken) return;

		try {
			setIsSaving(true);
			await privacyApi.updateMusicPreferences(accessToken, {
				genres: selectedGenres,
			});
			setInitialGenres(selectedGenres);
			navigation.goBack();
		} catch (error) {
			const message = apiErrorMessage(error, "Impossible d'enregistrer vos préférences");
			showError(message);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return <LoadingSpinner fullScreen message="Chargement…" />;
	}

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[styles.content, { paddingBottom: playerHeight + theme.spacing.xl }]}
			>
				<View style={styles.header}>
					<Text style={styles.subtitle}>
						Quels genres aimez-vous ? Choisissez-en jusqu'à {MAX_GENRES}.
					</Text>
				</View>

				<View style={styles.selectorContainer}>
					<GenreSelector
						selectedGenres={selectedGenres}
						onGenreToggle={handleGenreToggle}
						maxGenres={MAX_GENRES}
					/>
				</View>

				<Button
					variant="primary"
					onPress={handleSave}
					loading={isSaving}
					disabled={!hasChanges || isSaving}
					fullWidth={false}
					style={styles.saveButton}
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
			paddingVertical: theme.spacing.lg,
		},
		header: {
			paddingHorizontal: theme.spacing.lg,
			marginBottom: theme.spacing.lg,
		},
		subtitle: {
			fontSize: 16,
			color: theme.colors.textSecondary,
			lineHeight: 22,
		},
		selectorContainer: {
			backgroundColor: theme.colors.surface,
			borderRadius: 16,
			marginHorizontal: theme.spacing.lg,
			marginBottom: theme.spacing.lg,
		},
		saveButton: {
			marginHorizontal: theme.spacing.lg,
		},
	});
