import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import type { ProfilePrivacy, VisibilityLevel } from '@/types/user.types';
import { useAuthStore } from '@/store/authStore';
import { privacyApi, ApiError } from '@/services/privacyApi';
import { Button } from '@components/common/Button';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { VisibilityToggle } from '@components/profile/VisibilityToggle';
import { showError } from '@utils/toast';

export function PrivacySettingsScreen() {
  const { theme } = useTheme();
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
        const message = error instanceof ApiError ? error.message : 'Unable to load settings';
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
      const message = error instanceof ApiError ? error.message : 'Unable to save settings';
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  if (!privacy) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load settings</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy</Text>
          <Text style={styles.subtitle}>Control who can see your information</Text>
        </View>

        <View style={styles.settings}>
          <VisibilityToggle
            label="Profile picture"
            description="Who can see your avatar"
            value={privacy.avatarVisibility}
            onChange={value => handleVisibilityChange('avatarVisibility', value)}
          />

          <VisibilityToggle
            label="Email address"
            description="Who can see your email"
            value={privacy.emailVisibility}
            onChange={value => handleVisibilityChange('emailVisibility', value)}
          />

          <VisibilityToggle
            label="Bio"
            description="Who can see your bio"
            value={privacy.bioVisibility}
            onChange={value => handleVisibilityChange('bioVisibility', value)}
          />

          <VisibilityToggle
            label="Music preferences"
            description="Who can see your favorite genres"
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
          Save
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
