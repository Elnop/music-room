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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { profileApi, ApiError } from '@/services/profileApi';
import { Button, Input, FormError } from '@components/common';
import { COLORS, SPACING } from '@constants';

// Validation schema (aligned with backend)
const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name cannot be empty')
    .max(50, 'Display name must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, accessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    if (!accessToken) {
      Alert.alert('Error', 'You are not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Only send fields that have values
      const updateData: any = {};
      if (data.displayName && data.displayName.trim()) {
        updateData.displayName = data.displayName.trim();
      }
      if (data.bio && data.bio.trim()) {
        updateData.bio = data.bio.trim();
      }

      const updatedProfile = await profileApi.updateProfile(accessToken, updateData);

      // Update local user state
      useAuthStore.setState({ user: updatedProfile });

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : 'Failed to update profile';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.subtitle}>Update your profile information</Text>

        {error && <FormError message={error} />}

        {/* Display Name Input */}
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Display Name"
              placeholder="Enter your display name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.displayName?.message}
              autoCapitalize="words"
              returnKeyType="next"
            />
          )}
        />

        {/* Bio Input */}
        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Bio"
              placeholder="Tell us about yourself..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.bio?.message}
              multiline
              numberOfLines={4}
              style={styles.bioInput}
              returnKeyType="done"
            />
          )}
        />

        {/* Info Text */}
        <Text style={styles.infoText}>
          Note: You cannot change your username or email. Contact support if you need to
          update these fields.
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
            Save Changes
          </Button>

          <Button
            variant="outline"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
            style={styles.actionButton}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actions: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  actionButton: {
    marginBottom: SPACING.sm,
  },
});
