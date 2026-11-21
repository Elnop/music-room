import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export function useMemberChange() {
	const [processing, setProcessing] = useState<string | null>(null);
	const change = useMutation({
		mutationFn: (request: () => Promise<void>) => request(),
	});

	async function run(userId: string, request: () => Promise<void>) {
		setProcessing(userId);
		try {
			await change.mutateAsync(request);
		} finally {
			setProcessing(null);
		}
	}

	return { processing, run };
}
