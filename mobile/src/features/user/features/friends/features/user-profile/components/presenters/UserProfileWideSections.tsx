import React from 'react';
import { ProfileInfoRows } from '@/features/user/shared/profile-info-rows/ProfileInfoRows';
import type { ProfileInfoRow } from '@/features/user/shared/profile-info-rows/profileInfoRowsTypes';
import { memberSinceLabel } from '@/features/user/shared/member-since/memberSinceLabel';
import type { FilteredProfile } from '@/features/user/features/friends/friendsTypes';
import type { ViewedProfile } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { UserProfileGenres } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileGenres';
import { UserProfileListening } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileListening';
import { UserProfileWidePlaylists } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileWidePlaylists';
import { UserProfileWideSection } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileWideSection';

type UserProfileWideSectionsProps = {
	viewed: ViewedProfile;
};

function infoRows(profile: FilteredProfile): ProfileInfoRow[] {
	const rows: ProfileInfoRow[] = [{ label: "Nom d'utilisateur", value: `@${profile.username}` }];
	if (profile.email) rows.push({ label: 'Email', value: profile.email });
	if (profile.favoriteArtist) {
		rows.push({ label: 'Artiste préféré', value: profile.favoriteArtist });
	}
	rows.push({ label: 'Membre depuis', value: memberSinceLabel(profile.createdAt) });
	return rows;
}

function showsListening({ follow, listening }: ViewedProfile): boolean {
	const isFriend = follow.status?.isFriend ?? false;
	return (
		listening.canControlMusic &&
		isFriend &&
		!listening.isLoading &&
		listening.devices.some(d => Boolean(d.track))
	);
}

export function UserProfileWideSections({ viewed }: UserProfileWideSectionsProps) {
	const { profile } = viewed;

	return (
		<>
			{showsListening(viewed) && (
				<UserProfileWideSection title="En écoute">
					<UserProfileListening listening={viewed.listening} />
				</UserProfileWideSection>
			)}
			<UserProfileWideSection title="Préférences musicales">
				<UserProfileGenres
					genres={profile.musicPreferences}
					isFriend={viewed.follow.status?.isFriend ?? false}
				/>
			</UserProfileWideSection>
			<UserProfileWideSection title="Information">
				<ProfileInfoRows rows={infoRows(profile)} />
			</UserProfileWideSection>
			<UserProfileWidePlaylists playlists={viewed.playlists} ownerName={profile.username} />
		</>
	);
}
