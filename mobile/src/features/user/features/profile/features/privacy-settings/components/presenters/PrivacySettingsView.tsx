import React from 'react';
import { ProfileScreenFrame } from '@/features/user/shared/profile-layout/ProfileScreenFrame';
import { PrivacyToggles } from '@/features/user/features/profile/features/privacy-settings/components/presenters/PrivacyToggles';
import type {
	PrivacyEditing,
	PrivacySave,
} from '@/features/user/features/profile/features/privacy-settings/privacySettingsTypes';
import { Button } from '@/shared/theme/components/Button';

type PrivacySettingsViewProps = {
	bottomPadding: number;
	isLoading: boolean;
	editing: PrivacyEditing;
	save: PrivacySave;
};

export function PrivacySettingsView(props: PrivacySettingsViewProps) {
	const { editing, save } = props;
	const { privacy } = editing;

	return (
		<ProfileScreenFrame
			subtitle="Choisissez qui peut voir vos informations"
			bottomPadding={props.bottomPadding}
			isLoading={props.isLoading}
			errorMessage={!privacy ? 'Impossible de charger les paramètres' : null}
		>
			{privacy && (
				<>
					<PrivacyToggles privacy={privacy} onVisibilityChange={editing.onVisibilityChange} />
					<Button
						variant="primary"
						onPress={save.onSave}
						loading={save.isSaving}
						disabled={!save.hasChanges || save.isSaving}
						title="Enregistrer"
					/>
				</>
			)}
		</ProfileScreenFrame>
	);
}
