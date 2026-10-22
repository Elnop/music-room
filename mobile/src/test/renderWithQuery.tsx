import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Renders `ui` with a QueryClient of its own, without retries (one failure is
 * the answer). Call `client.clear()` after the test (state.md).
 */
export function renderWithQuery(ui: React.ReactElement) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	const view = render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
	return { ...view, client };
}
