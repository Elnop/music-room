const pathOf = (url: string) => url.replace(/^[a-z]+:\/\/[^/]+/i, '');

type Route = Response | ((body: unknown) => Response | Promise<Response>);

/** Any request missing from `routes` fails the test. */
export function mockFetchRoutes(routes: Record<string, Route>) {
	const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
		const key = `${init?.method ?? 'GET'} ${pathOf(url)}`;
		const route = routes[key];
		if (!route) throw new Error(`Unexpected request: ${key}`);
		const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
		return typeof route === 'function' ? route(body) : route;
	});
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	const calls = () =>
		fetchMock.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${pathOf(url)}`);
	return { fetchMock, routes, calls };
}
