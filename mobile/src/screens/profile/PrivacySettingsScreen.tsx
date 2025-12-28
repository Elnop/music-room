import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import type { ProfilePrivacy, VisibilityLevel } from '@/types/user.types';
import { useAuthStore } from '@/store/authStore';
import { privacyApi, ApiError } from '@/services/privacyApi';
import { Button } from '@components/common/Button';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { FloatingHeader } from '@/components/common/FloatingHeader';
import { VisibilityToggle } from '@components/profile/VisibilityToggle';

export function PrivacySettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
  const { accessToken } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [privacy, setPrivacy] = useState<ProfilePrivacy | null>(null);
  const [initialPrivacy, setInitialPrivacy] = useState<ProfilePrivacy | null>(null);

  // Hide navigation header
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

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
        const message =
          error instanceof ApiError ? error.message : 'Impossible de charger les paramètres';
        Alert.alert('Erreur', message);
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
      setInitialPrivacy(privacy);
      navigation.goBack();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Impossible de sauvegarder les paramètres';
      Alert.alert('Erreur', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  if (!privacy) {
    return (
      <View style={styles.container}>
        <FloatingHeader />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Impossible de charger les paramètres</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating header */}
      <FloatingHeader />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Confidentialité</Text>
          <Text style={styles.subtitle}>Contrôlez qui peut voir vos informations</Text>
        </View>

        <View style={styles.settings}>
          <VisibilityToggle
            label="Photo de profil"
            description="Qui peut voir votre avatar"
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
            description="Qui peut voir vos genres favoris"
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

const createStyles = (theme: Theme, topInset: number) =>
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
      paddingTop: topInset + 60, // Space for floating header
    },
    header: {
      marginBottom: theme.spacing.xl,
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
