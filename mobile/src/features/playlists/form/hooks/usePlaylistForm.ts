import { useState } from 'react';
import { useController, useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { queryKeys } from '@/shared/query/keys';
import { useSession } from '@/shared/services/authSession';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { showError, showSuccess } from '@/shared/utils/toast';
import {
	useCreatePlaylist,
	useUpdatePlaylist,
} from '@/features/playlists/hooks/usePlaylistMutations';
import { playlistFormSchema, type PlaylistFormInput } from '@/features/playlists/validators';
import type { Playlist, PlaylistStackParamList } from '@/features/playlists/types';

// Playlist field limits (the backend allows 100 and 500)
const PLAYLIST_LIMITS = { NAME_MAX: 50, DESCRIPTION_MAX: 500 } as const;

type Navigation = NativeStackNavigationProp<PlaylistStackParamList, 'CreatePlaylist'>;

export interface CappedField {
	value: string;
	onChangeText: (text: string) => void;
	error?: string;
	max: number;
}

function useCappedField(
	control: Control<PlaylistFormInput>,
	name: keyof PlaylistFormInput,
	max: number
): CappedField {
	const { field, fieldState } = useController({ control, name });
	return {
		value: field.value ?? '',
		onChangeText: text => field.onChange(text.slice(0, max)),
		error: fieldState.error?.message,
		max,
	};
}

export interface PlaylistForm {
	isEditing: boolean;
	name: CappedField;
	description: CappedField;
	isPrivate: boolean;
	setIsPrivate: (value: boolean) => void;
	isEditRestricted: boolean;
	setIsEditRestricted: (value: boolean) => void;
	submit: () => void;
	isSubmitting: boolean;
}

export function usePlaylistForm(
	navigation: Navigation,
	editedId: string | undefined
): PlaylistForm {
	const client = useQueryClient();
	const signedIn = useSession(session => session.user !== null);
	// Prefilled once, from the screen it was opened from: later changes must not reset the input.
	const [edited] = useState<Pick<Playlist, 'name' | 'description'> | undefined>(() =>
		editedId === undefined
			? undefined
			: (client.getQueryData<Playlist>(queryKeys.playlists.detail(editedId)) ??
				client.getQueryData<Playlist[]>(queryKeys.playlists.list())?.find(p => p.id === editedId))
	);
	const [isPrivate, setIsPrivate] = useState(false);
	const [isEditRestricted, setIsEditRestricted] = useState(false);
	const create = useCreatePlaylist();
	const update = useUpdatePlaylist();
	const { control, handleSubmit, formState } = useForm<PlaylistFormInput>({
		resolver: zodResolver(playlistFormSchema),
		defaultValues: { name: edited?.name ?? '', description: edited?.description ?? '' },
	});

	const onSubmit = async (data: PlaylistFormInput) => {
		if (editedId !== undefined) {
			try {
				await update.mutateAsync({
					id: editedId,
					changes: { name: data.name, description: data.description ?? '' },
				});
				showSuccess('Playlist modifiée');
				navigation.goBack();
			} catch (error) {
				logger.error('[CreatePlaylistScreen] Update playlist failed:', error);
				showError(apiErrorMessage(error, 'Impossible de modifier la playlist'));
			}
			return;
		}
		if (!signedIn) {
			showError('Connexion requise pour créer une playlist');
			return;
		}
		try {
			const created = await create.mutateAsync({
				...data,
				visibility: isPrivate ? 'private' : 'public',
				editMode: isEditRestricted ? 'restricted' : 'open',
			});
			navigation.replace('PlaylistDetail', { id: created.id });
		} catch (error) {
			logger.error('[CreatePlaylistScreen] Create playlist failed:', error);
			showError(apiErrorMessage(error, 'Impossible de créer la playlist'));
		}
	};

	return {
		isEditing: editedId !== undefined,
		name: useCappedField(control, 'name', PLAYLIST_LIMITS.NAME_MAX),
		description: useCappedField(control, 'description', PLAYLIST_LIMITS.DESCRIPTION_MAX),
		isPrivate,
		setIsPrivate,
		isEditRestricted,
		setIsEditRestricted,
		submit: handleSubmit(onSubmit),
		isSubmitting: formState.isSubmitting,
	};
}
