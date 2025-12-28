import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@store/authStore';
import { usePlaylistStore } from '@store/playlistStore';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { playlistFormSchema, type PlaylistFormInput } from '@utils/validators';
import type { EditMode } from '@/types/playlist.types';

// Playlist field limits
const PLAYLIST_LIMITS = {
  NAME_MAX: 20,
  DESCRIPTION_MAX: 70,
};

type PlaylistStackParamList = {
  Playlists: undefined;
  PlaylistDetail: { id: string };
  CreatePlaylist: undefined;
  SearchTracks: { playlistId: string };
};

type CreatePlaylistScreenNavigationProp = NativeStackNavigationProp<
  PlaylistStackParamList,
  'CreatePlaylist'
>;

interface CreatePlaylistScreenProps {
  navigation: CreatePlaylistScreenNavigationProp;
}

export function CreatePlaylistScreen({ navigation }: CreatePlaylistScreenProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuthStore();
  const { createPlaylist, isLoading } = usePlaylistStore();

  const [isPrivate, setIsPrivate] = useState(false);
  const [isEditRestricted, setIsEditRestricted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PlaylistFormInput>({
    resolver: zodResolver(playlistFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: PlaylistFormInput) => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer une playlist');
      return;
    }

    const visibility = isPrivate ? 'private' : 'public';
    const editMode: EditMode = isEditRestricted ? 'restricted' : 'open';

    try {
      await createPlaylist(user.id, {
        ...data,
        visibility,
        editMode,
      });
      navigation.goBack();
    } catch (error) {
      console.error('[CreatePlaylistScreen] Create playlist failed:', error);
      Alert.alert('Erreur', 'Impossible de créer la playlist');
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.form}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <Input
                      label="Nom de la playlist"
                      value={value}
                      onChangeText={text => onChange(text.slice(0, PLAYLIST_LIMITS.NAME_MAX))}
                      placeholder="Ma super playlist"
                      error={errors.name?.message}
                      autoFocus
                      maxLength={PLAYLIST_LIMITS.NAME_MAX}
                    />
                    <Text style={styles.charCount}>
                      {value?.length || 0}/{PLAYLIST_LIMITS.NAME_MAX}
                    </Text>
                  </View>
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <Input
                      label="Description (Optionnel)"
                      value={value || ''}
                      onChangeText={text =>
                        onChange(text.slice(0, PLAYLIST_LIMITS.DESCRIPTION_MAX))
                      }
                      placeholder="Décrivez votre playlist..."
                      error={errors.description?.message}
                      multiline
                      numberOfLines={3}
                      maxLength={PLAYLIST_LIMITS.DESCRIPTION_MAX}
                    />
                    <Text style={styles.charCount}>
                      {value?.length || 0}/{PLAYLIST_LIMITS.DESCRIPTION_MAX}
                    </Text>
                  </View>
                )}
              />

              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Playlist privée</Text>
                    <Text style={styles.toggleDescription}>
                      {isPrivate
                        ? 'Visible uniquement par les personnes invitées'
                        : 'Visible par tous les utilisateurs'}
                    </Text>
                  </View>
                  <Switch
                    value={isPrivate}
                    onValueChange={setIsPrivate}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={theme.colors.surface}
                  />
                </View>
              </View>

              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Édition restreinte</Text>
                    <Text style={styles.toggleDescription}>
                      {isEditRestricted
                        ? 'Seules les personnes autorisées peuvent modifier'
                        : 'Tout le monde peut ajouter/supprimer des morceaux'}
                    </Text>
                  </View>
                  <Switch
                    value={isEditRestricted}
                    onValueChange={setIsEditRestricted}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={theme.colors.surface}
                  />
                </View>
              </View>

              <Button
                title="Créer la playlist"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                fullWidth
                variant="primary"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingTop: theme.spacing.md,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xl,
    },
    form: {
      gap: theme.spacing.md,
    },
    toggleSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      borderWidth: theme.borders.medium,
      borderColor: theme.colors.border,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggleInfo: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    toggleLabel: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    toggleDescription: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    summarySection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      borderWidth: theme.borders.medium,
      borderColor: theme.colors.border,
      marginTop: theme.spacing.sm,
    },
    summaryTitle: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
      gap: theme.spacing.sm,
    },
    summaryText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
    },
    charCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'right',
      marginTop: -theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
  });
