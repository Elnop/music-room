import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QUERY_DEFAULTS } from '@/shared/backend/configs/queryDefaultsConfig';

export function renderWithClient(
	ui: React.ReactElement,
	client = new QueryClient({ defaultOptions: QUERY_DEFAULTS }),
) {
	function wrap(element: React.ReactElement) {
		return <QueryClientProvider client={client}>{element}</QueryClientProvider>;
	}
	const view = render(wrap(ui));
	return { ...view, client, rerender: (next: React.ReactElement) => view.rerender(wrap(next)) };
}
