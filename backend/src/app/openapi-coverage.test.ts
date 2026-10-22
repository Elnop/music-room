import type { Router } from 'express';
import { describe, expect, it } from 'vitest';
import { routes } from '@/app/routes.js';
import { swaggerSpec } from '@/app/openapi.js';

/**
 * Every route mounted through the registry must have its OpenAPI entry, and
 * every documented /api operation must match a mounted route (AGENTS.md: a new
 * endpoint without its OpenAPI entry is unfinished). Routes mounted directly in
 * server.ts (/health, /api-docs) are outside the registry and not walked.
 */

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const;

interface RouteLayer {
	name?: string;
	handle?: { stack?: unknown };
	route?: { path: string | string[]; methods: Record<string, boolean> };
}

/**
 * Express 5 keeps a `router.use('/sub', subRouter)` mount path only inside a
 * compiled matcher, so a nested router cannot be walked reliably: report it
 * instead of silently skipping its endpoints. Plain middleware is skipped.
 */
function isRouterLayer(layer: RouteLayer): boolean {
	return !layer.route && Array.isArray(layer.handle?.stack);
}

/** Express `:param` segments become OpenAPI `{param}`; trailing slash dropped. */
function toOpenApiPath(prefix: string, routePath: string): string {
	const joined = `${prefix}${routePath === '/' ? '' : routePath}`;
	return joined.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function featureStack(router: Router): RouteLayer[] {
	return (router as Router & { stack: RouteLayer[] }).stack;
}

function mountedOperations(): Set<string> {
	const operations = new Set<string>();
	for (const { path: prefix, router } of routes) {
		for (const layer of featureStack(router)) {
			if (!layer.route) continue;
			const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
			for (const routePath of paths) {
				for (const [method, enabled] of Object.entries(layer.route.methods)) {
					if (!enabled || method === '_all') continue;
					operations.add(`${method.toUpperCase()} ${toOpenApiPath(prefix, routePath)}`);
				}
			}
		}
	}
	return operations;
}

function documentedOperations(): Set<string> {
	const operations = new Set<string>();
	for (const [path, item] of Object.entries(swaggerSpec.paths)) {
		if (!item || !path.startsWith('/api/')) continue;
		for (const method of HTTP_METHODS) {
			if (item[method]) operations.add(`${method.toUpperCase()} ${path}`);
		}
	}
	return operations;
}

describe('OpenAPI coverage', () => {
	const mounted = mountedOperations();
	const documented = documentedOperations();

	it('finds no nested router it cannot walk', () => {
		const nested = routes
			.filter(({ router }) => featureStack(router).some(isRouterLayer))
			.map(({ path }) => path);
		expect(nested, 'Features mounting a sub-router: document and check its routes').toEqual([]);
	});

	it('finds the mounted routes', () => {
		expect(mounted.size).toBeGreaterThan(0);
	});

	it('documents every mounted route', () => {
		const undocumented = [...mounted].filter(op => !documented.has(op)).sort();
		expect(undocumented, 'Mounted routes missing from the OpenAPI spec').toEqual([]);
	});

	it('documents no route that is not mounted', () => {
		const stale = [...documented].filter(op => !mounted.has(op)).sort();
		expect(stale, 'OpenAPI operations matching no mounted route').toEqual([]);
	});
});
