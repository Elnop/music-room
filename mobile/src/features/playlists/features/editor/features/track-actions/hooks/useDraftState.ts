import { useState } from 'react';
import type { DraftState } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';

export function useDraftState(): DraftState {
	const [field, setField] = useState<{ name: string; error?: string }>({ name: '' });
	const [creating, setCreating] = useState(false);

	return {
		name: field.name,
		error: field.error,
		creating,
		rename: name => setField({ name }),
		reset: name => setField({ name }),
		setError: error => setField(current => ({ ...current, error })),
		setCreating,
	};
}
