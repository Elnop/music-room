import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

interface LatencySummary {
	count?: number;
	min?: number | null;
	median?: number | null;
	p95?: number | null;
	p99?: number | null;
	max?: number | null;
}

interface ArtilleryReport {
	aggregate: {
		counters?: Record<string, number>;
		summaries?: Record<string, LatencySummary>;
		rates?: Record<string, number>;
		firstMetricAt: number;
		lastMetricAt: number;
	};
}

interface SocketReport {
	clients: number;
	fixtureUsers: number;
	durationSeconds: number;
	elapsedSeconds: number;
	timeoutMs: number;
	connections?: {
		ok?: number;
		failed?: number;
		joined?: number;
		controlTarget?: string;
		failuresByReason?: Record<string, number>;
	};
	metrics?: Record<string, LatencySummary | undefined>;
	edits?: { sent?: number; failed?: number; deliveriesReceived?: number; deliveriesExpected?: number };
	controls?: { sent?: number; failed?: number };
	timeouts?: Record<string, number | undefined>;
	late?: Record<string, number | undefined>;
	errors?: Record<string, number>;
}

const ENDPOINT_PREFIX = 'plugins.metrics-by-endpoint.response_time.';
const ENDPOINT_CODE_PREFIX = 'plugins.metrics-by-endpoint.';
const SOCKET_REPORT = 'socket.json';
const SOCKET_LOG = 'socket.log';

const print = (line: string) => process.stdout.write(`${line}\n`);
const printError = (line: string) => process.stderr.write(`${line}\n`);

const ms = (value: number | null | undefined) => (typeof value === 'number' ? value.toFixed(1) : '-');

function readJson<T>(path: string): T {
	return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function latencyRow(label: string, requests: number, seconds: number, summary: LatencySummary = {}) {
	const rps = seconds > 0 ? (requests / seconds).toFixed(1) : '-';
	const s = summary;
	return `| ${label} | ${requests} | ${rps} | ${ms(s.min)} | ${ms(s.median)} | ${ms(s.p95)} | ${ms(s.p99)} | ${ms(s.max)} |`;
}

function prefixedEntries(counters: Record<string, number>, prefix: string, keep = (_key: string) => true) {
	return Object.entries(counters)
		.filter(([key]) => key.startsWith(prefix) && keep(key))
		.map(([key, value]) => `${key.slice(prefix.length)}: ${value}`);
}

function scenarioSection(dir: string, file: string) {
	const { aggregate } = readJson<ArtilleryReport>(join(dir, file));
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

	const codes = prefixedEntries(counters, 'http.codes.');
	const endpointCodes = prefixedEntries(counters, ENDPOINT_CODE_PREFIX, key => key.includes('.codes.'));
	const errors = prefixedEntries(counters, 'errors.');

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

function socketLatencyRow(label: string, summary: LatencySummary = {}) {
	const s = summary;
	return `| ${label} | ${s.count ?? 0} | ${ms(s.min)} | ${ms(s.median)} | ${ms(s.p95)} | ${ms(s.p99)} | ${ms(s.max)} |`;
}

function entries(obj: Record<string, number> | undefined) {
	return (
		Object.entries(obj ?? {})
			.map(([k, v]) => `${k}: ${v}`)
			.join(', ') || 'none'
	);
}

function socketSection(dir: string) {
	const r = readJson<SocketReport>(join(dir, SOCKET_REPORT));
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
		`- Connections: ${c.ok ?? 0} ok, ${c.failed ?? 0} failed (${entries(c.failuresByReason)}); ${c.joined ?? 0} in the playlist room; control target (perf_0 device): ${c.controlTarget ?? '-'}`,
		`- Edits: ${e.sent ?? 0} sent, ${e.failed ?? 0} failed; broadcast deliveries ${e.deliveriesReceived ?? 0}/${e.deliveriesExpected ?? 0}`,
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

function conditionsSection(dir: string) {
	const rateLimitEnabled = process.env.PERF_RATE_LIMIT_ENABLED || 'true (default)';
	const whitelist = process.env.PERF_RATE_LIMIT_WHITELIST_IPS || '(empty)';
	const lines = [
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
		lines.push(
			'',
			'> Warning: rate limiting was on with no whitelisted IP; the global auth limiter allows RATE_LIMIT_AUTH_MAX requests per RATE_LIMIT_AUTH_WINDOW_MS per IP on /api/auth/* (20 per 15 minutes by default), so a second run within 15 minutes gets 429s on login.'
		);
	}
	return lines.join('\n');
}

function main(dir: string | undefined): number {
	if (!dir) {
		printError('Usage: perf-summary.ts <results directory>');
		return 1;
	}
	const files = readdirSync(dir).filter(file => file.endsWith('.json'));
	const reports = files.filter(file => file !== SOCKET_REPORT).sort();
	const hasSocketReport = files.includes(SOCKET_REPORT);
	const socketCrashedBeforeReport = !hasSocketReport && existsSync(join(dir, SOCKET_LOG));
	if (reports.length === 0 && !hasSocketReport && !socketCrashedBeforeReport) {
		printError(`No report (*.json) in ${dir}`);
		return 1;
	}

	const sections = reports.map(file => scenarioSection(dir, file));
	if (hasSocketReport) sections.push(socketSection(dir));
	else if (socketCrashedBeforeReport) {
		sections.push(
			[
				'## socket (real time)',
				'',
				`The socket scenario failed before writing ${SOCKET_REPORT}; see ${join(dir, SOCKET_LOG)}.`,
				'',
			].join('\n')
		);
	}
	const summary = [conditionsSection(dir), '', ...sections].join('\n');
	const out = join(dir, 'summary.md');
	writeFileSync(out, summary);
	print(summary);
	print(`Summary written to ${out}`);
	return 0;
}

process.exit(main(process.argv[2]));
