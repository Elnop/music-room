import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { useAuthStore } from '../../store/authStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { playlistSchema, PlaylistInput } from '@utils/validators';

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
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PlaylistInput>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      name: '',
      description: '',
      visibility: 'public',
    },
  });

  const onSubmit = async (data: PlaylistInput) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a playlist');
      return;
    }

    try {
      await createPlaylist(user.id, { ...data, visibility });
      Alert.alert('Success', 'Playlist created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Create Playlist</Text>

            <View style={styles.form}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Playlist Name"
                    value={value}
                    onChangeText={onChange}
                    placeholder="My Awesome Playlist"
                    error={errors.name?.message}
                    autoFocus
                  />
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Description (Optional)"
                    value={value || ''}
                    onChangeText={onChange}
                    placeholder="Describe your playlist..."
                    error={errors.description?.message}
                    multiline
                    numberOfLines={3}
                  />
                )}
              />

              <View style={styles.visibilitySection}>
                <Text style={styles.label}>Visibility</Text>
                <View style={styles.visibilityButtons}>
                  <View style={styles.visibilityButton}>
                    <Button
                      title="Public"
                      onPress={() => setVisibility('public')}
                      variant={visibility === 'public' ? 'primary' : 'outline'}
                      fullWidth
                    />
                  </View>
                  <View style={styles.visibilityButton}>
                    <Button
                      title="Private"
                      onPress={() => setVisibility('private')}
                      variant={visibility === 'private' ? 'primary' : 'outline'}
                      fullWidth
                    />
                  </View>
                </View>
              </View>

              <Button
                title="Create Playlist"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                fullWidth
                variant="primary"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    visibilitySection: {
      marginVertical: theme.spacing.sm,
    },
    label: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    visibilityButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    visibilityButton: {
      flex: 1,
    },
  });
