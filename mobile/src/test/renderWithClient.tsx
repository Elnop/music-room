import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/shared/query/queryClient';

/**
 * Renders `ui` with the app's own QueryClient (cache profiles and retries as in
 * the app), or with `client` seeded by the test. Call `client.clear()` after
 * the test (state.md).
 */
export function renderWithClient(ui: React.ReactElement, client = createQueryClient()) {
	const wrap = (element: React.ReactElement) => (
		<QueryClientProvider client={client}>{element}</QueryClientProvider>
	);
	const view = render(wrap(ui));
	return { ...view, client, rerender: (next: React.ReactElement) => view.rerender(wrap(next)) };
}
