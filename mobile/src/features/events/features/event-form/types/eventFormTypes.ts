import type { z } from 'zod';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CappedField } from '@/shared/theme/types/cappedFieldTypes';
import type { MusicGenre } from '@/shared/users/userTypes';
import type { eventFormSchema } from '@/features/events/features/event-form/eventFormSchemas';
import type {
	Coordinates,
	EventStackParamList,
	PlaylistChoice,
} from '@/features/events/eventTypes';

export type EventFormInput = z.infer<typeof eventFormSchema>;

export type EventFormNavigation = NativeStackNavigationProp<EventStackParamList, 'EventForm'>;

export type Located = Coordinates & {
	address: string;
};

export type EventPlace = {
	isLocating: boolean;
	locateHere: () => void;
	resolve: (address: string) => Promise<Coordinates | null>;
};

export type EventGenres = {
	genres: MusicGenre[];
	toggleGenre: (genre: MusicGenre) => void;
	genresError?: string;
	requireGenres: () => boolean;
};

export type EventSchedule = {
	startsAt: Date;
	endsAt: Date;
	pickStart: () => void;
	pickEnd: () => void;
};

export type EventDraft = EventGenres &
	EventSchedule & {
		playlistId: string | null;
		selectPlaylist: (id: string | null) => void;
	};

export type EventFormFields = {
	name: CappedField;
	description: CappedField;
	address: CappedField;
	accessInfo: CappedField;
};

export type EventForm = EventFormFields &
	EventDraft & {
		isEditing: boolean;
		place: EventPlace;
		playlists: PlaylistChoice[];
		submit: () => void;
		isSubmitting: boolean;
	};
