import React from 'react';
import { ProfileSection } from '@/features/user/shared/profile-section/ProfileSection';
import { ProfileInfoRows, memberSinceLabel } from '@/features/user/shared/profile-info-rows/ProfileInfoRows';
import type { UserProfile } from '@/shared/users/user.types';

interface ProfileInfoSectionProps {
	user: UserProfile;
	prominent?: boolean;
}

export function ProfileInfoSection({ user, prominent }: ProfileInfoSectionProps) {
	return (
		<ProfileSection title="Information" prominent={prominent}>
			<ProfileInfoRows
				rows={[
					{ label: 'Email', value: user.email },
					{ label: "Nom d'utilisateur", value: `@${user.username}` },
					{ label: 'Membre depuis', value: memberSinceLabel(user.createdAt) },
				]}
			/>
		</ProfileSection>
	);
}
