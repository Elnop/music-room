import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import type { ProfilePrivacy, VisibilityLevel } from '@/types/user.types';
import { useAuthStore } from '@/store/authStore';
import { privacyApi, ApiError } from '@/services/privacyApi';
import { Button } from '@components/common/Button';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { VisibilityToggle } from '@components/profile/VisibilityToggle';

export function PrivacySettingsScreen() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const { accessToken } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [privacy, setPrivacy] = useState<ProfilePrivacy | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load privacy settings
  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const data = await privacyApi.getPrivacySettings(accessToken);
      setPrivacy(data);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load settings';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisibilityChange = (field: keyof ProfilePrivacy, value: VisibilityLevel) => {
    if (!privacy) return;

    setPrivacy({
      ...privacy,
      [field]: value,
    });
    setHasChanges(true);
  };

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
      setHasChanges(false);
      navigation.goBack();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to save settings';
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

  if (!privacy) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Failed to load privacy settings</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Settings</Text>
          <Text style={styles.subtitle}>Control who can see your profile information</Text>
        </View>

        <View style={styles.settings}>
          <VisibilityToggle
            label="Profile Picture"
            description="Who can see your avatar"
            value={privacy.avatarVisibility}
            onChange={value => handleVisibilityChange('avatarVisibility', value)}
          />

          <VisibilityToggle
            label="Email Address"
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
            label="Music Preferences"
            description="Who can see your favorite genres"
            value={privacy.musicPreferencesVisibility}
            onChange={value => handleVisibilityChange('musicPreferencesVisibility', value)}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Public:</Text> Everyone can see{'\n'}
            <Text style={styles.infoLabel}>Friends Only:</Text> Only mutual friends{'\n'}
            <Text style={styles.infoLabel}>Private:</Text> Only you can see
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
          Save Changes
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
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    infoIcon: {
      fontSize: 20,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    infoLabel: {
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    footer: {
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
  });
