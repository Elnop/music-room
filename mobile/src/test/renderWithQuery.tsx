import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/** Own QueryClient without retries (one failure is the answer); call `client.clear()` after the test. */
export function renderWithQuery(ui: React.ReactElement) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	const view = render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
	return { ...view, client };
}
