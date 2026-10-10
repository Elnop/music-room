#!/usr/bin/env node
// Turns the JSON reports of one run into summary.md (make perf-test): the
// Artillery reports (<scenario>.json) and the real-time report (socket.json,
// written by backend/src/test/perf-socket.ts, its own shape).
// No dependency: runs with the Node of the host.
//
// Usage: node tests/performance/summarize.mjs <results/<timestamp> directory>
// Run conditions come from the environment: PERF_TARGET, PERF_USERS,
// PERF_RATE_LIMIT_ENABLED, PERF_RATE_LIMIT_WHITELIST_IPS.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const ENDPOINT_PREFIX = 'plugins.metrics-by-endpoint.response_time.';
const ENDPOINT_CODE_PREFIX = 'plugins.metrics-by-endpoint.';

const dir = process.argv[2];
if (!dir) {
	console.error('Usage: node summarize.mjs <results directory>');
	process.exit(1);
}

const SOCKET_REPORT = 'socket.json';
const SOCKET_LOG = 'socket.log';

const files = readdirSync(dir).filter(file => file.endsWith('.json'));
const reports = files.filter(file => file !== SOCKET_REPORT).sort();
const hasSocketReport = files.includes(SOCKET_REPORT);
// perf-socket.ts crashed before writing its report.
const socketFailed = !hasSocketReport && existsSync(join(dir, SOCKET_LOG));
if (reports.length === 0 && !hasSocketReport && !socketFailed) {
	console.error(`No report (*.json) in ${dir}`);
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

function socketLatencyRow(label, summary) {
	const s = summary ?? {};
	return `| ${label} | ${s.count ?? 0} | ${ms(s.min)} | ${ms(s.median)} | ${ms(s.p95)} | ${ms(s.p99)} | ${ms(s.max)} |`;
}

function entries(obj) {
	const list = Object.entries(obj ?? {}).map(([k, v]) => `${k}: ${v}`);
	return list.join(', ') || 'none';
}

function socketSection() {
	const r = JSON.parse(readFileSync(join(dir, SOCKET_REPORT), 'utf8'));
	const c = r.connections ?? {};
	const m = r.metrics ?? {};
	const e = r.edits ?? {};
	const t = r.timeouts ?? {};
	const late = r.late ?? {};
	return [
		'## socket (real time)',
		'',
		`${r.clients} Socket.io clients (${r.fixtureUsers} fixture users, round-robin) on \`perf-shared\` for ${r.durationSeconds} s (elapsed ${r.elapsedSeconds} s); events not received within ${r.timeoutMs} ms count as timeouts.`,
		'',
		`- Connections: ${c.ok} ok, ${c.failed} failed (${entries(c.failuresByReason)}); ${c.joined} in the playlist room; control target (perf_0 device): ${c.controlTarget}`,
		`- Edits: ${e.sent} sent, ${e.failed} failed; broadcast deliveries ${e.deliveriesReceived}/${e.deliveriesExpected}`,
		`- Control actions: ${r.controls?.sent ?? 0} sent, ${r.controls?.failed ?? 0} refused`,
		`- Timeouts: edit broadcast ${t.editBroadcast ?? 0} (deliveries), control:success ${t.controlSuccess ?? 0}, control:command ${t.controlCommand ?? 0}; late arrivals: edit broadcast ${late.editBroadcast ?? 0}, control:success ${late.controlSuccess ?? 0}, control:command ${late.controlCommand ?? 0}`,
		`- Errors: ${entries(r.errors)}`,
		'',
		'| Metric | Samples | min (ms) | median (ms) | p95 (ms) | p99 (ms) | max (ms) |',
		'| --- | --- | --- | --- | --- | --- | --- |',
		socketLatencyRow('Connect (handshake)', m.connect),
		socketLatencyRow('Edit: HTTP add track', m.editHttp),
		socketLatencyRow('Edit: send -> playlist:updated (each client)', m.editBroadcast),
		socketLatencyRow('Control: emit -> control:success', m.controlSuccess),
		socketLatencyRow('Control: emit -> control:command (perf_0)', m.controlCommand),
		'',
	].join('\n');
}

const rateLimitEnabled = process.env.PERF_RATE_LIMIT_ENABLED || 'true (default)';
const whitelist = process.env.PERF_RATE_LIMIT_WHITELIST_IPS || '(empty)';
const conditions = [
	'# Load test summary',
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

const sections = reports.map(scenarioSection);
if (hasSocketReport) sections.push(socketSection());
else if (socketFailed) {
	sections.push(
		[
			'## socket (real time)',
			'',
			`The socket scenario failed before writing ${SOCKET_REPORT}; see ${join(dir, SOCKET_LOG)}.`,
			'',
		].join('\n')
	);
}
const summary = [conditions.join('\n'), '', ...sections].join('\n');
const out = join(dir, 'summary.md');
writeFileSync(out, summary);
console.log(summary);
console.log(`Summary written to ${out}`);
