#!/usr/bin/env node
// Turns the Artillery JSON reports of one run into summary.md (make perf-test).
// No dependency: runs with the Node of the host.
//
// Usage: node tests/performance/summarize.mjs <results/<timestamp> directory>
// Run conditions come from the environment: PERF_TARGET, PERF_USERS,
// PERF_RATE_LIMIT_ENABLED, PERF_RATE_LIMIT_WHITELIST_IPS.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const ENDPOINT_PREFIX = 'plugins.metrics-by-endpoint.response_time.';
const ENDPOINT_CODE_PREFIX = 'plugins.metrics-by-endpoint.';

const dir = process.argv[2];
if (!dir) {
	console.error('Usage: node summarize.mjs <results directory>');
	process.exit(1);
}

const reports = readdirSync(dir)
	.filter(file => file.endsWith('.json'))
	.sort();
if (reports.length === 0) {
	console.error(`No Artillery report (*.json) in ${dir}`);
	process.exit(1);
}

const ms = value => (typeof value === 'number' ? value.toFixed(1) : '-');

function latencyRow(label, requests, seconds, summary) {
	const rps = seconds > 0 ? (requests / seconds).toFixed(1) : '-';
	const s = summary ?? {};
	return `| ${label} | ${requests} | ${rps} | ${ms(s.min)} | ${ms(s.median)} | ${ms(s.p95)} | ${ms(s.p99)} | ${ms(s.max)} |`;
}

function scenarioSection(file) {
	const { aggregate } = JSON.parse(readFileSync(join(dir, file), 'utf8'));
	const counters = aggregate.counters ?? {};
	const summaries = aggregate.summaries ?? {};
	const seconds = (aggregate.lastMetricAt - aggregate.firstMetricAt) / 1000;
	const requests = counters['http.requests'] ?? 0;

	const lines = [
		`## ${basename(file, '.json')}`,
		'',
		`Duration ${seconds.toFixed(1)} s, Artillery request rate ${aggregate.rates?.['http.request_rate'] ?? '-'}/s.`,
		'',
		'| Endpoint | Requests | req/s | min (ms) | median (ms) | p95 (ms) | p99 (ms) | max (ms) |',
		'| --- | --- | --- | --- | --- | --- | --- | --- |',
		latencyRow('**All**', requests, seconds, summaries['http.response_time']),
	];

	for (const key of Object.keys(summaries).filter(k => k.startsWith(ENDPOINT_PREFIX))) {
		const name = key.slice(ENDPOINT_PREFIX.length);
		const count = Object.entries(counters)
			.filter(([k]) => k.startsWith(`${ENDPOINT_CODE_PREFIX}${name}.codes.`))
			.reduce((sum, [, v]) => sum + v, 0);
		lines.push(latencyRow(name, count, seconds, summaries[key]));
	}

	const codes = Object.entries(counters)
		.filter(([k]) => k.startsWith('http.codes.'))
		.map(([k, v]) => `${k.slice('http.codes.'.length)}: ${v}`);
	const endpointCodes = Object.entries(counters)
		.filter(([k]) => k.startsWith(ENDPOINT_CODE_PREFIX) && k.includes('.codes.'))
		.map(([k, v]) => `${k.slice(ENDPOINT_CODE_PREFIX.length)}: ${v}`);
	const errors = Object.entries(counters)
		.filter(([k]) => k.startsWith('errors.'))
		.map(([k, v]) => `${k.slice('errors.'.length)}: ${v}`);

	lines.push(
		'',
		`- Status codes: ${codes.join(', ') || 'none'}`,
		`- By endpoint: ${endpointCodes.join(', ') || 'none'}`,
		`- Errors: ${errors.join(', ') || 'none'}`,
		`- Virtual users: ${counters['vusers.created'] ?? 0} created, ${counters['vusers.completed'] ?? 0} completed, ${counters['vusers.failed'] ?? 0} failed`,
		''
	);
	return lines.join('\n');
}

const rateLimitEnabled = process.env.PERF_RATE_LIMIT_ENABLED || 'true (default)';
const whitelist = process.env.PERF_RATE_LIMIT_WHITELIST_IPS || '(empty)';
const conditions = [
	'# HTTP load test summary',
	'',
	`Run: ${basename(dir)}`,
	'',
	'## Conditions',
	'',
	`- Target: ${process.env.PERF_TARGET || 'unknown'}`,
	`- Fixture users: ${process.env.PERF_USERS || 'unknown'}`,
	`- Backend RATE_LIMIT_ENABLED: ${rateLimitEnabled}`,
	`- Backend RATE_LIMIT_WHITELIST_IPS: ${whitelist}`,
	`- Host: ${process.platform}, Node ${process.version}`,
];
if (!rateLimitEnabled.startsWith('false') && whitelist === '(empty)') {
	conditions.push(
		'',
		'> Warning: rate limiting was on with no whitelisted IP; the global auth limiter allows RATE_LIMIT_AUTH_MAX requests per RATE_LIMIT_AUTH_WINDOW_MS per IP on /api/auth/* (20 per 15 minutes by default), so a second run within 15 minutes gets 429s on login.'
	);
}

const summary = [conditions.join('\n'), '', ...reports.map(scenarioSection)].join('\n');
const out = join(dir, 'summary.md');
writeFileSync(out, summary);
console.log(summary);
console.log(`Summary written to ${out}`);
