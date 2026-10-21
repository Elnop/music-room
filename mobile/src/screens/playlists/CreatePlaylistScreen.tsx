import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedSwitch } from '@components/common/ThemedSwitch';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@store/authStore';
import { usePlaylistStore } from '@store/playlistStore';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { playlistFormSchema, type PlaylistFormInput } from '@utils/validators';
import type { EditMode } from '@/types/playlist.types';
import { showError, showSuccess } from '@utils/toast';
import { apiErrorMessage } from '@utils/apiErrorMessage';
import { logger } from '@/utils/logger';

// Playlist field limits (the backend allows 100 and 500)
const PLAYLIST_LIMITS = {
	NAME_MAX: 50,
	DESCRIPTION_MAX: 500,
};

type PlaylistStackParamList = {
	Playlists: undefined;
	PlaylistDetail: { id: string };
	/** With a playlistId, the form edits that playlist's name and description (#342). */
	CreatePlaylist: { playlistId?: string } | undefined;
	SearchTracks: { playlistId: string };
};

type CreatePlaylistScreenNavigationProp = NativeStackNavigationProp<
	PlaylistStackParamList,
	'CreatePlaylist'
>;

type CreatePlaylistScreenRouteProp = RouteProp<PlaylistStackParamList, 'CreatePlaylist'>;

interface CreatePlaylistScreenProps {
	navigation: CreatePlaylistScreenNavigationProp;
	route: CreatePlaylistScreenRouteProp;
}

export function CreatePlaylistScreen({ navigation, route }: CreatePlaylistScreenProps) {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const { user } = useAuthStore();
	const { createPlaylist, updatePlaylist, currentPlaylist, playlists } = usePlaylistStore();

	const editedId = route.params?.playlistId;
	const isEditing = editedId !== undefined;
	// The playlist being edited, as shown on the screen it was opened from.
	const edited = React.useMemo(
		() =>
			currentPlaylist?.id === editedId ? currentPlaylist : playlists.find(p => p.id === editedId),
		// Prefill once: later store changes must not reset what the user typed.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[editedId]
	);

	const [isPrivate, setIsPrivate] = useState(false);
	const [isEditRestricted, setIsEditRestricted] = useState(false);

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<PlaylistFormInput>({
		resolver: zodResolver(playlistFormSchema),
		defaultValues: {
			name: edited?.name ?? '',
			description: edited?.description ?? '',
		},
	});

	const onSubmitEdit = async (id: string, data: PlaylistFormInput) => {
		try {
			await updatePlaylist(id, { name: data.name, description: data.description ?? '' });
			showSuccess('Playlist modifiée');
			navigation.goBack();
		} catch (error) {
			logger.error('[CreatePlaylistScreen] Update playlist failed:', error);
			showError(apiErrorMessage(error, 'Impossible de modifier la playlist'));
		}
	};

	const onSubmit = async (data: PlaylistFormInput) => {
		if (editedId !== undefined) {
			await onSubmitEdit(editedId, data);
			return;
		}

		if (!user) {
			showError('Connexion requise pour créer une playlist');
			return;
		}

		const visibility = isPrivate ? 'private' : 'public';
		const editMode: EditMode = isEditRestricted ? 'restricted' : 'open';

		try {
			const created = await createPlaylist(user.id, {
				...data,
				visibility,
				editMode,
			});
			// Open the new playlist in place of the form (#342).
			navigation.replace('PlaylistDetail', { id: created.id });
		} catch (error) {
			logger.error('[CreatePlaylistScreen] Create playlist failed:', error);
			showError(apiErrorMessage(error, 'Impossible de créer la playlist'));
		}
	};

	return (
		<View style={styles.container}>
			<KeyboardAvoidingView
				style={styles.keyboardAvoid}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<ScrollView
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingBottom: playerHeight + theme.spacing.xl },
					]}
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
											label="Description (facultative)"
											value={value || ''}
											onChangeText={text =>
												onChange(text.slice(0, PLAYLIST_LIMITS.DESCRIPTION_MAX))
											}
											placeholder="Décrivez votre playlist…"
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

							{/* Visibility and edit rights are changed on « Visibilité et droits ». */}
							{!isEditing && (
								<>
									<View style={styles.toggleSection}>
										<View style={styles.toggleRow}>
											<View style={styles.toggleInfo}>
												<Text style={styles.toggleLabel}>Playlist privée</Text>
												<Text style={styles.toggleDescription}>
													{isPrivate ? 'Visible uniquement par les invités' : 'Visible par tous'}
												</Text>
											</View>
											<ThemedSwitch value={isPrivate} onValueChange={setIsPrivate} />
										</View>
									</View>

									<View style={styles.toggleSection}>
										<View style={styles.toggleRow}>
											<View style={styles.toggleInfo}>
												<Text style={styles.toggleLabel}>Modification restreinte</Text>
												<Text style={styles.toggleDescription}>
													{isEditRestricted
														? 'Seules les personnes autorisées peuvent la modifier'
														: 'Tout le monde peut ajouter ou retirer des titres'}
												</Text>
											</View>
											<ThemedSwitch value={isEditRestricted} onValueChange={setIsEditRestricted} />
										</View>
									</View>
								</>
							)}

							<Button
								title={isEditing ? 'Enregistrer' : 'Créer la playlist'}
								onPress={handleSubmit(onSubmit)}
								loading={isSubmitting}
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
