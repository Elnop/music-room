import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QUERY_DEFAULTS } from '@/shared/backend/configs/queryDefaultsConfig';
import { onSessionEnd } from '@/shared/backend/lib/sessionEnd';

type QueryProviderProps = {
	children: React.ReactNode;
	client?: QueryClient;
};

export function QueryProvider({ children, client }: QueryProviderProps) {
	const [queryClient] = useState(
		() => client ?? new QueryClient({ defaultOptions: QUERY_DEFAULTS }),
	);

	useEffect(() => {
		const unsubscribe = onSessionEnd(() => queryClient.clear());
		return () => {
			unsubscribe();
		};
	}, [queryClient]);

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
