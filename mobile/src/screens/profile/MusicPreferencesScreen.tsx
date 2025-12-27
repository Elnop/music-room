import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import type { MusicGenre } from '@/types/user.types';
import { MAX_GENRES } from '@/types/user.types';
import { useAuthStore } from '@/store/authStore';
import { privacyApi, ApiError } from '@/services/privacyApi';
import { Button } from '@components/common/Button';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { GenreSelector } from '@components/profile/GenreSelector';

export function MusicPreferencesScreen() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
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
        const message = error instanceof ApiError ? error.message : 'Failed to load preferences';
        Alert.alert('Error', message);
      } finally {
        setIsLoading(false);
      }
    };

    loadMusicPreferences();
  }, [accessToken]);

  const handleGenreToggle = (genre: MusicGenre) => {
    const isSelected = selectedGenres.includes(genre);

    if (isSelected) {
      // Remove genre
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else if (selectedGenres.length < MAX_GENRES) {
      // Add genre
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  // Check if there are actual changes compared to initial state
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
      setInitialGenres(selectedGenres); // Reset initial state after save
      navigation.goBack();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to save preferences';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Music Preferences</Text>
          <Text style={styles.subtitle}>
            Tell us what music you love! Select up to {MAX_GENRES} genres.
          </Text>
        </View>

        <View style={styles.selectorContainer}>
          <GenreSelector
            selectedGenres={selectedGenres}
            onGenreToggle={handleGenreToggle}
            maxGenres={MAX_GENRES}
          />
        </View>

        {selectedGenres.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Your Selection</Text>
            <Text style={styles.previewText}>
              {selectedGenres.length === 1
                ? "You've selected 1 genre"
                : `You've selected ${selectedGenres.length} genres`}
            </Text>
          </View>
        )}

        <View style={styles.tipBox}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Your music preferences will be visible based on your privacy settings. You can change
            who sees them in Privacy Settings.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleSave}
          loading={isSaving}
          disabled={!hasChanges || isSaving}
        >
          Save Preferences
        </Button>
      </View>
    </SafeAreaView>
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
    title: {
      fontSize: 28,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
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
    previewSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    previewTitle: {
      fontSize: 14,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    previewText: {
      fontSize: 14,
      color: theme.colors.primary,
    },
    tipBox: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginHorizontal: theme.spacing.lg,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    tipIcon: {
      fontSize: 20,
    },
    tipText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    footer: {
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });
