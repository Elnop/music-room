import { GENRE_INFO } from '@/shared/theme/configs/genresConfig';
import type { MusicGenre, RecommendedProfile } from '@/features/user/features/friends/friendsTypes';

function commonGenresLabel(genres: MusicGenre[]): string {
	return genres.map(genre => GENRE_INFO[genre].label).join(' · ');
}

export function profileName(profile: RecommendedProfile): string {
	return profile.displayName || profile.username;
}

export function similarProfileLabel(profile: RecommendedProfile): string {
	return `${profileName(profile)}, goûts en commun : ${commonGenresLabel(profile.commonGenres)}`;
}
