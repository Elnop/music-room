import type { DebouncedText } from '@/features/playlists/features/editor/shared/debounced-text/debouncedTextTypes';
import type {
	PlaylistMember,
	UserSummary,
} from '@/features/playlists/shared/playlist/playlistTypes';

export type SharingMode = {
	isPrivate: boolean;
	isEditRestricted: boolean;
};

export type SharingMembers = {
	members: PlaylistMember[];
	isLoading: boolean;
	busy: boolean;
	refetch: () => void;
	add: (user: UserSummary, asViewer: boolean, canEdit: boolean) => void;
	remove: (userId: string, isPrivate: boolean) => Promise<void>;
};

export type SharingSettings = {
	isUpdating: boolean;
	toggleVisibility: () => void;
	toggleEditMode: () => void;
};

export type UserSearch = {
	search: DebouncedText;
	results: UserSummary[];
	isSearching: boolean;
};

export type PlaylistSharing = {
	mode: SharingMode;
	isInfoOnly: boolean;
	members: SharingMembers;
	settings: SharingSettings;
	userSearch: UserSearch;
	addUser: (user: UserSummary) => void;
	removeUser: (userId: string) => Promise<void>;
	bottomPadding: number;
};

export type MemberList = {
	members: PlaylistMember[];
	isLoading: boolean;
	refetch: () => void;
	setMembers: (update: (list: PlaylistMember[]) => PlaylistMember[]) => void;
};

export type MemberEdits = {
	id: string;
	members: PlaylistMember[];
	setMembers: MemberList['setMembers'];
	processing: string | null;
	run: (userId: string, request: () => Promise<void>) => Promise<void>;
};
