import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Button } from '@/shared/theme/components/Button';
import { CappedInput } from '@/shared/theme/components/CappedInput';
import type { EventForm } from '@/features/events/features/event-form/hooks/useEventForm';
import { createEventScreenStyles } from '@/features/events/shared/event-screen/eventScreenStyles';
import { DateTimeRow } from '@/features/events/features/event-form/components/presenters/DateTimeRow';
import { GenreSelector } from '@/features/events/features/event-form/components/presenters/GenreSelector';
import { PlaylistSelector } from '@/features/events/features/event-form/components/presenters/PlaylistSelector';

type EventFormViewProps = {
	form: EventForm;
	bottomPadding: number;
};

export function EventFormView({ form, bottomPadding }: EventFormViewProps) {
	const { styles } = useThemedStyles(createEventScreenStyles);

	return (
		<KeyboardAvoidingView
			style={styles.screen}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<ScrollView
				contentContainerStyle={[styles.body, { paddingBottom: bottomPadding }]}
				keyboardShouldPersistTaps="handled"
			>
				<CappedInput
					field={form.name}
					label="Nom de l'événement"
					placeholder="Soirée sur le toit"
					onEnter={form.isSubmitting ? undefined : form.submit}
				/>
				<CappedInput
					field={form.description}
					label="Description (facultative)"
					placeholder="L'ambiance, le programme…"
					multiline
				/>
				<>
					<CappedInput field={form.address} label="Adresse" placeholder="96 bd Bessières, Paris" />
					<Button
						title="Utiliser ma position actuelle"
						variant="outline"
						onPress={form.place.locateHere}
						loading={form.place.isLocating}
						fullWidth
					/>
				</>
				<CappedInput
					field={form.accessInfo}
					label="Comment y accéder (facultatif)"
					placeholder="Bâtiment C, 7e étage, code 4512"
					multiline
				/>
				<GenreSelector
					selected={form.genres}
					onToggle={form.toggleGenre}
					error={form.genresError}
				/>
				<DateTimeRow label="Début" value={form.startsAt} onPress={form.pickStart} />
				<DateTimeRow label="Fin" value={form.endsAt} onPress={form.pickEnd} />
				<PlaylistSelector
					playlists={form.playlists}
					selectedId={form.playlistId}
					onSelect={form.selectPlaylist}
				/>
				<Button
					title={form.isEditing ? 'Enregistrer' : "Créer l'événement"}
					onPress={form.submit}
					loading={form.isSubmitting}
					fullWidth
					variant="primary"
				/>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
