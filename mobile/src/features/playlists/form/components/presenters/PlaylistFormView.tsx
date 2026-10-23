import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/shared/components/ui/Button';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { PlaylistForm } from '@/features/playlists/form/hooks/usePlaylistForm';
import { CappedInput } from './CappedInput';
import { ToggleCard } from './ToggleCard';

interface PlaylistFormViewProps {
	form: PlaylistForm;
	playerHeight: number;
}

/** Name and description; visibility and edit rights on creation only. */
export function PlaylistFormView({ form, playerHeight }: PlaylistFormViewProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.screen}>
			<KeyboardAvoidingView
				style={styles.keyboard}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<ScrollView
					contentContainerStyle={[
						styles.scroll,
						{ paddingBottom: playerHeight + theme.spacing.xl },
					]}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.body}>
						<View style={styles.form}>
							<CappedInput
								field={form.name}
								label="Nom de la playlist"
								placeholder="Ma super playlist"
								autoFocus
							/>
							<CappedInput
								field={form.description}
								label="Description (facultative)"
								placeholder="Décrivez votre playlist…"
								multiline
							/>

							{/* Visibility and edit rights are changed on « Visibilité et droits ». */}
							{!form.isEditing && (
								<>
									<ToggleCard
										label="Playlist privée"
										description={
											form.isPrivate ? 'Visible uniquement par les invités' : 'Visible par tous'
										}
										value={form.isPrivate}
										onValueChange={form.setIsPrivate}
									/>
									<ToggleCard
										label="Modification restreinte"
										description={
											form.isEditRestricted
												? 'Seules les personnes autorisées peuvent la modifier'
												: 'Tout le monde peut ajouter ou retirer des titres'
										}
										value={form.isEditRestricted}
										onValueChange={form.setIsEditRestricted}
									/>
								</>
							)}

							<Button
								title={form.isEditing ? 'Enregistrer' : 'Créer la playlist'}
								onPress={form.submit}
								loading={form.isSubmitting}
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
		screen: { flex: 1, backgroundColor: theme.colors.background },
		keyboard: { flex: 1 },
		scroll: { flexGrow: 1, paddingTop: theme.spacing.md },
		body: { flex: 1, padding: theme.spacing.lg },
		form: { gap: theme.spacing.md },
	});
