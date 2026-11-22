import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/shared/backend/createQueryClient';

export function renderWithClient(ui: React.ReactElement, client = createQueryClient()) {
	function wrap(element: React.ReactElement) {
		return <QueryClientProvider client={client}>{element}</QueryClientProvider>;
	}
	const view = render(wrap(ui));
	return { ...view, client, rerender: (next: React.ReactElement) => view.rerender(wrap(next)) };
}
