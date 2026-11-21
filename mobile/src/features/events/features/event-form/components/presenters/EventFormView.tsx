import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Button } from '@/shared/theme/components/Button';
import type { EventForm } from '@/features/events/features/event-form/types/eventFormTypes';
import { createEventScreenStyles } from '@/features/events/shared/event-screen/createEventScreenStyles';
import { EventChoiceFields } from '@/features/events/features/event-form/components/presenters/EventChoiceFields';
import { EventTextFields } from '@/features/events/features/event-form/components/presenters/EventTextFields';

type EventFormViewProps = {
	form: EventForm;
	bottomPadding: number;
};

function bottomPaddingStyle(paddingBottom: number): ViewStyle {
	return { paddingBottom };
}

export function EventFormView({ form, bottomPadding }: EventFormViewProps) {
	const { styles } = useThemedStyles(createEventScreenStyles);

	return (
		<KeyboardAvoidingView
			style={styles.screen}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<ScrollView
				contentContainerStyle={[styles.body, bottomPaddingStyle(bottomPadding)]}
				keyboardShouldPersistTaps="handled"
			>
				<EventTextFields form={form} />
				<EventChoiceFields form={form} />
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
