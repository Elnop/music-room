/** The path and query string of an absolute URL. */
const pathOf = (url: string) => url.replace(/^[a-z]+:\/\/[^/]+/i, '');

/** Answers a request: a fixed response, or one built from the JSON body sent. */
type Route = Response | ((body: unknown) => Response | Promise<Response>);

/**
 * Replaces `globalThis.fetch` with a mock that answers `"<METHOD> <path>"`
 * (path with its query string) from `routes`; any other request fails the test.
 * Routes can be changed later through the returned object.
 */
export function mockFetchRoutes(routes: Record<string, Route>) {
	const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
		const key = `${init?.method ?? 'GET'} ${pathOf(url)}`;
		const route = routes[key];
		if (!route) throw new Error(`Unexpected request: ${key}`);
		const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
		return typeof route === 'function' ? route(body) : route;
	});
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	/** The requests sent, as "<METHOD> <path>". */
	const calls = () =>
		fetchMock.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${pathOf(url)}`);
	return { fetchMock, routes, calls };
}
