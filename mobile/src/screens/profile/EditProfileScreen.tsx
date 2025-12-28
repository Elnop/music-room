import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import type { UpdateProfileData } from '@/types/user.types';
import { useAuthStore } from '@/store/authStore';
import { profileApi, ApiError } from '@/services/profileApi';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { FormError } from '@components/common/FormError';
import { FloatingHeader } from '@/components/common/FloatingHeader';

// Profile field limits (aligned with backend)
const PROFILE_LIMITS = {
  DISPLAY_NAME_MAX: 15,
  BIO_MAX: 300,
};

// Validation schema (aligned with backend)
const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Le nom ne peut pas être vide')
    .max(PROFILE_LIMITS.DISPLAY_NAME_MAX, `${PROFILE_LIMITS.DISPLAY_NAME_MAX} caractères max`),
  bio: z
    .string()
    .max(PROFILE_LIMITS.BIO_MAX, `${PROFILE_LIMITS.BIO_MAX} caractères max`)
    .optional()
    .or(z.literal('')),
});

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export function EditProfileScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
  const { user, accessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hide navigation header
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: user?.displayName || user?.username || '',
      bio: user?.bio || '',
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    if (!accessToken) {
      Alert.alert('Erreur', "Vous n'êtes pas authentifié");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updateData: Partial<UpdateProfileData> = {};

      const trimmedDisplayName = data.displayName.trim();
      if (trimmedDisplayName) {
        updateData.displayName = trimmedDisplayName;
      }

      if (data.bio !== undefined) {
        updateData.bio = data.bio.trim();
      }

      const updatedProfile = await profileApi.updateProfile(accessToken, updateData);

      useAuthStore.setState({ user: updatedProfile });

      navigation.goBack();
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : 'Impossible de mettre à jour le profil';
      setError(errorMessage);
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Floating header */}
      <FloatingHeader />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Modifier le profil</Text>
          <Text style={styles.subtitle}>Mettez à jour vos informations</Text>

          {error && <FormError message={error} />}

          {/* Display Name Input */}
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <Input
                  label="Nom d'affichage"
                  placeholder="Entrez votre nom"
                  value={value}
                  onChangeText={text => onChange(text.slice(0, PROFILE_LIMITS.DISPLAY_NAME_MAX))}
                  onBlur={onBlur}
                  error={errors.displayName?.message}
                  autoCapitalize="words"
                  returnKeyType="next"
                  maxLength={PROFILE_LIMITS.DISPLAY_NAME_MAX}
                />
                <Text style={styles.charCount}>
                  {value?.length || 0}/{PROFILE_LIMITS.DISPLAY_NAME_MAX}
                </Text>
              </View>
            )}
          />

          {/* Bio Input */}
          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <Input
                  label="Bio"
                  placeholder="Parlez-nous de vous..."
                  value={value}
                  onChangeText={text => onChange(text.slice(0, PROFILE_LIMITS.BIO_MAX))}
                  onBlur={onBlur}
                  error={errors.bio?.message}
                  multiline
                  numberOfLines={4}
                  style={styles.bioInput}
                  returnKeyType="done"
                  maxLength={PROFILE_LIMITS.BIO_MAX}
                />
                <Text style={styles.charCount}>
                  {value?.length || 0}/{PROFILE_LIMITS.BIO_MAX}
                </Text>
              </View>
            )}
          />

          {/* Info Text */}
          <Text style={styles.infoText}>
            Note : Vous ne pouvez pas modifier votre nom d'utilisateur ou email. Contactez le
            support si nécessaire.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              variant="primary"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isDirty || isLoading}
              style={styles.actionButton}
            >
              Enregistrer
            </Button>

            <Button
              variant="outline"
              onPress={() => navigation.goBack()}
              disabled={isLoading}
              style={styles.actionButton}
            >
              Annuler
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (theme: Theme, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: theme.spacing.lg,
      paddingTop: topInset + 60, // Space for floating header
    },
    title: {
      fontSize: 28,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xl,
    },
    bioInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'right',
      marginTop: -theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    infoText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    actions: {
      marginTop: theme.spacing.md,
      gap: theme.spacing.md,
    },
    actionButton: {
      marginBottom: theme.spacing.sm,
    },
  });
