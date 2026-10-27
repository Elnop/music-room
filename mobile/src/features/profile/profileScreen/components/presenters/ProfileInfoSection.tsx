import React from 'react';
import { ProfileSection } from '@/shared/components/profile/ProfileSection';
import { ProfileInfoRows, memberSinceLabel } from '@/shared/components/profile/ProfileInfoRows';
import type { UserProfile } from '@/types/user.types';

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
