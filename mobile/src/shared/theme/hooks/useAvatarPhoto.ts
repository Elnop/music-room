import { useState } from 'react';
import { sizedAvatarUri } from '@/shared/theme/lib/sizedAvatarUri';

type PhotoStatus = {
	loaded: string | null;
	failed: string | null;
};

export function useAvatarPhoto(uri: string | undefined, size: number) {
	const source = uri ? sizedAvatarUri(uri, size) : undefined;
	const [status, setStatus] = useState<PhotoStatus>({ loaded: null, failed: null });
	const photo = source && status.failed !== source ? source : undefined;
	return {
		uri: photo,
		showInitials: status.loaded !== photo,
		onLoad: () => setStatus((current) => ({ ...current, loaded: photo ?? null })),
		onError: () => setStatus((current) => ({ ...current, failed: photo ?? null })),
	};
}
