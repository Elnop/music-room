import type { PlaylistFormInput } from '@/features/playlists/features/editor/shared/playlist-mutations/types/playlistFormTypes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCappedField } from '@/shared/theme/hooks/useCappedField';
import { playlistFormSchema } from '@/features/playlists/features/editor/shared/playlist-mutations/playlistSchemas';
import { useEditedPlaylist } from '@/features/playlists/features/editor/features/playlist-form/hooks/useEditedPlaylist';
import { usePlaylistSettings } from '@/features/playlists/features/editor/features/playlist-form/hooks/usePlaylistSettings';
import { useSubmitPlaylist } from '@/features/playlists/features/editor/features/playlist-form/hooks/useSubmitPlaylist';
import type {
	PlaylistForm,
	PlaylistFormNavigation,
} from '@/features/playlists/features/editor/features/playlist-form/playlistFormTypes';

const PLAYLIST_LIMITS = { NAME_MAX: 50, DESCRIPTION_MAX: 500 } as const;

export function usePlaylistForm(
	navigation: PlaylistFormNavigation,
	editedId: string | undefined
): PlaylistForm {
	const edited = useEditedPlaylist(editedId);
	const settings = usePlaylistSettings();
	const submitPlaylist = useSubmitPlaylist(navigation, editedId, settings);
	const form = useForm<PlaylistFormInput>({
		resolver: zodResolver(playlistFormSchema),
		defaultValues: { name: edited?.name ?? '', description: edited?.description ?? '' },
	});

	return {
		...settings,
		isEditing: editedId !== undefined,
		name: useCappedField(form.control, 'name', PLAYLIST_LIMITS.NAME_MAX),
		description: useCappedField(form.control, 'description', PLAYLIST_LIMITS.DESCRIPTION_MAX),
		submit: form.handleSubmit(submitPlaylist),
		isSubmitting: form.formState.isSubmitting,
	};
}
