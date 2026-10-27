import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProfileSection } from '@/shared/components/profile/ProfileSection';
import {
	ProfileInfoRows,
	memberSinceLabel,
	type ProfileInfoRow,
} from '@/shared/components/profile/ProfileInfoRows';
import { GenreChip } from '@/shared/components/ui/GenreChip';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Theme } from '@/shared/theme/types';
import type { FilteredProfile, FriendPlaylistSummary } from '@/features/friends/types';
import { FriendPlaylistCard } from './FriendPlaylistCard';
import { HiddenFieldNote } from './HiddenFieldNote';
import { Text } from '@/shared/components/ui/Text';

interface UserProfileWideSectionsProps {
	profile: FilteredProfile;
	isFriend: boolean;
	playlists: FriendPlaylistSummary[];
	onSelectPlaylist: (playlistId: string) => void;
	/** The friend's listening, shown first when there is some. */
	listening?: React.ReactNode;
}

/** A field the server leaves out is hidden by privacy; null or empty means the user left it blank. */
function infoRows(profile: FilteredProfile): ProfileInfoRow[] {
	const rows: ProfileInfoRow[] = [{ label: "Nom d'utilisateur", value: `@${profile.username}` }];
	if (profile.email) rows.push({ label: 'Email', value: profile.email });
	if (profile.favoriteArtist)
		rows.push({ label: 'Artiste préféré', value: profile.favoriteArtist });
	rows.push({ label: 'Membre depuis', value: memberSinceLabel(profile.createdAt) });
	return rows;
}

/** The wide profile's column, under its header: the same sections and cards as my own profile. */
export function UserProfileWideSections({
	profile,
	isFriend,
	playlists,
	onSelectPlaylist,
	listening,
}: UserProfileWideSectionsProps) {
	const { styles } = useThemedStyles(createStyles);
	const genres = profile.musicPreferences;

	return (
		<>
			{listening && (
				<View style={styles.section}>
					<ProfileSection title="En écoute" prominent>
						{listening}
					</ProfileSection>
				</View>
			)}
			<View style={styles.section}>
				<ProfileSection title="Préférences musicales" prominent>
					{genres === undefined ? (
						<HiddenFieldNote label={isFriend ? 'Privées' : 'Visibles uniquement par ses amis'} />
					) : genres.length > 0 ? (
						<View style={styles.genres}>
							{genres.map(genre => (
								<GenreChip key={genre} genre={genre} selected size="sm" />
							))}
						</View>
					) : (
						<Text style={styles.empty}>Aucun genre choisi</Text>
					)}
				</ProfileSection>
			</View>
			<View style={styles.section}>
				<ProfileSection title="Information" prominent>
					<ProfileInfoRows rows={infoRows(profile)} />
				</ProfileSection>
			</View>
			{playlists.length > 0 && (
				<View style={styles.section}>
					<ProfileSection title="Playlists" prominent>
						{playlists.map(playlist => (
							<FriendPlaylistCard
								key={playlist.id}
								playlist={playlist}
								ownerName={profile.username}
								onPress={() => onSelectPlaylist(playlist.id)}
								style={styles.playlist}
							/>
						))}
					</ProfileSection>
				</View>
			)}
		</>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		section: { marginTop: theme.spacing.md },
		genres: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
		empty: { fontSize: theme.typography.sizes.md, color: theme.colors.textSecondary },
		playlist: { paddingHorizontal: 0 },
	});
