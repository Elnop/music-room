/**
 * Real-time load scenario (`make perf-test`, subject IV.7).
 *
 * Reads the fixtures written by perf-fixtures.ts (tests/performance/fixtures/
 * users.csv and env.json; no sign-in), then:
 * - connects perf_0 on its licensed device `perf-device-0` (control target);
 * - connects PERF_SOCKET_CLIENTS clients (default: the fixture user count),
 *   users taken round-robin, one deviceId `perf-socket-<k>` per client;
 * - every client joins the shared playlist room `perf-shared`;
 * - for PERF_SOCKET_DURATION seconds (default 30), every ~2 s with jitter, each
 *   client either adds a uniquely named track over HTTP then deletes it, or
 *   (users other than perf_0) sends `control:action` to perf_0's device.
 *
 * Measured, on the clock of this process: connect time; edit latency from the
 * HTTP send to the `playlist:updated` carrying that track, for every client in
 * the room (fan-out); control latency from the emit to `control:success` at
 * the sender and to `control:command` at perf_0. Events not received within
 * TIMEOUT_MS are counted as timeouts, not as samples. Each client sends at most
 * one action per ~2 s, far under the per-socket limits of
 * shared/security/socket-event-limit.ts, so the run measures the server, not the limiter.
 *
 * Event names and payloads: realtime/index.ts, realtime/socket-auth.ts.
 *
 * Run from backend/: `npx tsx src/test/perf-socket.ts --out <file.json>`.
 * Exits non-zero only when no client could connect (or the fixtures are missing).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { io as ioClient, type Socket } from 'socket.io-client';
import { z } from 'zod';

// CLI progress and report lines, not application logs: written to the
// terminal directly (see .agents/rules/logging.md#no-console).
const print = (line: string) => process.stdout.write(`${line}\n`);
const printError = (line: string) => process.stderr.write(`${line}\n`);

/** Track URIs under this prefix are cleaned by perf-fixtures.ts on every run. */
const PERF_TRACK_URI_PREFIX = 'https://soundcloud.com/zumik-perf/';
const TIMEOUT_MS = 5_000;
const INTERVAL_MS = 2_000;
const JITTER_MS = 500;
const CONNECT_BATCH = 20;
/** Time left to the playlist:join handlers (no ack) before the load starts. */
const JOIN_SETTLE_MS = 1_000;

const fixturesDir = new URL('../../../tests/performance/fixtures/', import.meta.url);

const envSchema = z.object({
	sharedPlaylistId: z.uuid(),
	ownerId: z.uuid(),
	deviceId: z.string().min(1),
	userCount: z.number().int().min(2),
});

interface FixtureUser {
	email: string;
	token: string;
	userId: string;
}

interface Client {
	index: number;
	user: FixtureUser;
	socket: Socket;
	joined: boolean;
	/** control:action sent by this socket, oldest first, waiting for control:success. */
	pendingSuccess: ControlRecord[];
}

interface ControlRecord {
	sentAt: number;
	successDone: boolean;
	commandDone: boolean;
	timedOut: boolean;
	settle: () => void;
}

interface PendingEdit {
	sentAt: number;
	expected: Set<number>;
	received: Set<number>;
	/** Deliveries received within TIMEOUT_MS of sentAt (the sampled ones). */
	onTime: number;
	settle: () => void;
}

interface Summary {
	count: number;
	min: number | null;
	median: number | null;
	p95: number | null;
	p99: number | null;
	max: number | null;
}

// ---------------------------------------------------------------------------
// Settings and fixtures

function parseOut(argv: string[]): string {
	const i = argv.indexOf('--out');
	const out = i >= 0 ? argv[i + 1] : undefined;
	if (!out) throw new Error('Usage: perf-socket.ts --out <report.json>');
	return out;
}

async function readFixtures(): Promise<{ users: FixtureUser[]; env: z.infer<typeof envSchema> }> {
	const csv = await readFile(new URL('users.csv', fixturesDir), 'utf8');
	const users = csv
		.trim()
		.split('\n')
		.slice(1)
		.map(line => {
			const [email, , token, userId] = line.split(',');
			return { email, token, userId };
		})
		.filter(u => u.email && u.token && u.userId);
	if (users.length === 0) throw new Error('fixtures/users.csv has no user; run make perf-fixtures');

	const raw: unknown = JSON.parse(await readFile(new URL('env.json', fixturesDir), 'utf8'));
	return { users, env: envSchema.parse(raw) };
}

// ---------------------------------------------------------------------------
// Metrics

const samples = {
	connect: [] as number[],
	editHttp: [] as number[],
	editBroadcast: [] as number[],
	controlSuccess: [] as number[],
	controlCommand: [] as number[],
};
const timeouts = { editBroadcast: 0, controlSuccess: 0, controlCommand: 0 };
const late = { editBroadcast: 0, controlSuccess: 0, controlCommand: 0 };
const errors: Record<string, number> = {};
const connectFailures: Record<string, number> = {};
const edits = { sent: 0, failed: 0, deliveriesExpected: 0, deliveriesReceived: 0 };
const controls = { sent: 0, failed: 0 };

function countError(key: string): void {
	errors[key] = (errors[key] ?? 0) + 1;
}

function summarize(values: number[]): Summary {
	const sorted = [...values].sort((a, b) => a - b);
	const at = (q: number) =>
		sorted.length === 0
			? null
			: sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)];
	return {
		count: sorted.length,
		min: sorted[0] ?? null,
		median: at(0.5),
		p95: at(0.95),
		p99: at(0.99),
		max: sorted[sorted.length - 1] ?? null,
	};
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const errorCode = (payload: unknown) =>
	payload && typeof payload === 'object' && 'code' in payload ? String(payload.code) : 'UNKNOWN';

// ---------------------------------------------------------------------------
// Connections

function connectSocket(
	target: string,
	token: string,
	deviceId: string
): Promise<{ socket: Socket } | { error: string }> {
	const socket = ioClient(target, {
		auth: {
			token,
			deviceId,
			deviceName: `Perf ${deviceId}`,
			platform: 'perf',
			model: 'perf-socket',
			appVersion: 'perf',
		},
		transports: ['websocket'],
		reconnection: false,
		forceNew: true,
		timeout: TIMEOUT_MS,
	});
	return new Promise(resolve => {
		socket.once('connect', () => resolve({ socket }));
		socket.once('connect_error', (err: Error) => {
			socket.close();
			resolve({ error: err.message || 'connect_error' });
		});
	});
}

async function connectClients(
	target: string,
	users: FixtureUser[],
	count: number
): Promise<Client[]> {
	const clients: Client[] = [];
	for (let start = 0; start < count; start += CONNECT_BATCH) {
		const batch = Array.from(
			{ length: Math.min(CONNECT_BATCH, count - start) },
			(_, i) => start + i
		);
		const results = await Promise.all(
			batch.map(async index => {
				const user = users[index % users.length];
				const begin = performance.now();
				const result = await connectSocket(target, user.token, `perf-socket-${index}`);
				if ('error' in result) {
					connectFailures[result.error] = (connectFailures[result.error] ?? 0) + 1;
					return null;
				}
				samples.connect.push(performance.now() - begin);
				return { index, user, socket: result.socket, joined: true, pendingSuccess: [] };
			})
		);
		for (const client of results) if (client) clients.push(client);
	}
	return clients;
}

// ---------------------------------------------------------------------------
// Scenario

interface Context {
	target: string;
	playlistId: string;
	ownerId: string;
	deviceId: string;
	clients: Client[];
	pendingEdits: Map<string, PendingEdit>;
	/** control:action by sender user id, oldest first, waiting for control:command at perf_0. */
	pendingCommands: Map<string, ControlRecord[]>;
}

async function http(
	ctx: Context,
	client: Client,
	method: 'POST' | 'DELETE',
	path: string,
	body?: unknown
): Promise<Response | null> {
	try {
		return await fetch(`${ctx.target}${path}`, {
			method,
			headers: {
				Authorization: `Bearer ${client.user.token}`,
				'Content-Type': 'application/json',
				'X-Platform': 'perf',
				'X-Device-Model': 'perf-socket',
				'X-App-Version': 'perf',
			},
			body: body === undefined ? undefined : JSON.stringify(body),
			signal: AbortSignal.timeout(TIMEOUT_MS * 2),
		});
	} catch (error) {
		countError(`http ${method} ${error instanceof Error ? error.name : 'error'}`);
		return null;
	}
}

/** Add a track over HTTP, wait for its broadcast in every joined client, delete it. */
async function edit(ctx: Context, client: Client): Promise<void> {
	const uri = `${PERF_TRACK_URI_PREFIX}socket-${crypto.randomUUID()}`;
	const expected = new Set(
		ctx.clients.filter(c => c.joined && c.socket.connected).map(c => c.index)
	);
	let settle = () => {};
	const done = new Promise<void>(resolve => (settle = resolve));
	const pending: PendingEdit = {
		sentAt: performance.now(),
		expected,
		received: new Set(),
		onTime: 0,
		settle,
	};
	ctx.pendingEdits.set(uri, pending);
	edits.sent += 1;

	const response = await http(ctx, client, 'POST', `/api/playlists/${ctx.playlistId}/tracks`, {
		trackUri: uri,
		title: `Perf socket ${client.index}`,
		artist: 'Zumik perf',
		durationMs: 180000,
	});
	if (!response || response.status !== 201) {
		if (response) countError(`http POST tracks ${response.status}`);
		edits.failed += 1;
		ctx.pendingEdits.delete(uri);
		return;
	}
	samples.editHttp.push(performance.now() - pending.sentAt);
	const json = (await response.json()) as { data?: { track?: { id?: string } } };
	const trackId = json.data?.track?.id;

	// The deadline runs from the send, like the samples.
	const timer = setTimeout(settle, Math.max(0, TIMEOUT_MS - (performance.now() - pending.sentAt)));
	if (pending.received.size >= expected.size) settle();
	await done;
	clearTimeout(timer);
	ctx.pendingEdits.delete(uri);
	edits.deliveriesExpected += expected.size;
	timeouts.editBroadcast += expected.size - pending.onTime;

	if (trackId) {
		const removed = await http(
			ctx,
			client,
			'DELETE',
			`/api/playlists/${ctx.playlistId}/tracks/${trackId}`
		);
		if (removed && !removed.ok) countError(`http DELETE tracks ${removed.status}`);
	}
}

/** Send play or pause to perf_0's device and wait for control:success and control:command. */
async function control(ctx: Context, client: Client): Promise<void> {
	let settle = () => {};
	const done = new Promise<void>(resolve => (settle = resolve));
	const record: ControlRecord = {
		sentAt: performance.now(),
		successDone: false,
		commandDone: false,
		timedOut: false,
		settle: () => {
			if (record.successDone && record.commandDone) settle();
		},
	};
	client.pendingSuccess.push(record);
	const queue = ctx.pendingCommands.get(client.user.userId) ?? [];
	queue.push(record);
	ctx.pendingCommands.set(client.user.userId, queue);
	controls.sent += 1;

	client.socket.emit('control:action', {
		targetUserId: ctx.ownerId,
		targetDeviceId: ctx.deviceId,
		action: Math.random() < 0.5 ? 'play' : 'pause',
	});

	const timer = setTimeout(() => {
		record.timedOut = true;
		if (!record.successDone) timeouts.controlSuccess += 1;
		if (!record.commandDone) timeouts.controlCommand += 1;
		settle();
	}, TIMEOUT_MS);
	await done;
	clearTimeout(timer);
}

function listen(ctx: Context, target: Socket | null): void {
	for (const client of ctx.clients) {
		const { socket } = client;
		socket.on('playlist:updated', (payload: { event?: string; track?: { trackUri?: string } }) => {
			if (payload.event !== 'track_added' || !payload.track?.trackUri) return;
			const pending = ctx.pendingEdits.get(payload.track.trackUri);
			if (!pending || pending.received.has(client.index)) return;
			pending.received.add(client.index);
			const latency = performance.now() - pending.sentAt;
			if (latency > TIMEOUT_MS) {
				late.editBroadcast += 1;
			} else {
				pending.onTime += 1;
				edits.deliveriesReceived += 1;
				samples.editBroadcast.push(latency);
			}
			if (pending.received.size >= pending.expected.size) pending.settle();
		});
		socket.on('playlist:error', (payload: unknown) => {
			client.joined = false;
			countError(`playlist:error ${errorCode(payload)}`);
		});
		socket.on('control:success', () => {
			const record = client.pendingSuccess.shift();
			if (!record) return;
			if (record.timedOut) late.controlSuccess += 1;
			else samples.controlSuccess.push(performance.now() - record.sentAt);
			record.successDone = true;
			record.settle();
		});
		socket.on('control:error', (payload: unknown) => {
			countError(`control:error ${errorCode(payload)}`);
			const record = client.pendingSuccess.shift();
			if (!record) return;
			controls.failed += 1;
			// No command follows a refusal: drop it from perf_0's waiting list.
			const queue = ctx.pendingCommands.get(client.user.userId);
			const at = queue?.indexOf(record) ?? -1;
			if (queue && at >= 0) queue.splice(at, 1);
			record.successDone = true;
			record.commandDone = true;
			record.settle();
		});
		socket.on('disconnect', (reason: string) => {
			if (reason !== 'io client disconnect') countError(`disconnect ${reason}`);
		});
	}

	target?.on('control:command', (payload: { fromUserId?: string }) => {
		const queue = payload.fromUserId ? ctx.pendingCommands.get(payload.fromUserId) : undefined;
		const record = queue?.shift();
		if (!record) {
			countError('control:command unmatched');
			return;
		}
		if (record.timedOut) late.controlCommand += 1;
		else samples.controlCommand.push(performance.now() - record.sentAt);
		record.commandDone = true;
		record.settle();
	});
}

async function runClient(ctx: Context, client: Client, endAt: number): Promise<void> {
	// Spread the first actions over one interval.
	await sleep(Math.random() * INTERVAL_MS);
	const canControl = client.user.userId !== ctx.ownerId;
	while (Date.now() < endAt && client.socket.connected) {
		const started = Date.now();
		if (canControl && Math.random() < 0.5) await control(ctx, client);
		else if (client.joined) await edit(ctx, client);
		const wait = INTERVAL_MS + (Math.random() * 2 - 1) * JITTER_MS - (Date.now() - started);
		if (wait > 0) await sleep(Math.min(wait, Math.max(0, endAt - Date.now())));
	}
}

// ---------------------------------------------------------------------------

async function main(): Promise<number> {
	const out = parseOut(process.argv.slice(2));
	const target = (process.env.PERF_TARGET || 'http://localhost:3000').replace(/\/$/, '');
	const durationSeconds = z.coerce
		.number()
		.int()
		.min(1)
		.parse(process.env.PERF_SOCKET_DURATION || '30');
	const { users, env } = await readFixtures();
	const clientCount = z.coerce
		.number()
		.int()
		.min(1)
		.max(5000)
		.parse(process.env.PERF_SOCKET_CLIENTS || String(users.length));

	const owner = users.find(u => u.userId === env.ownerId);
	if (!owner) throw new Error('perf_0 (ownerId of env.json) is missing from users.csv');

	print(`Connecting the control target (perf_0 on ${env.deviceId})...`);
	const targetResult = await connectSocket(target, owner.token, env.deviceId);
	const targetSocket = 'socket' in targetResult ? targetResult.socket : null;
	if (!targetSocket) {
		printError(`Control target refused: ${'error' in targetResult ? targetResult.error : ''}`);
		countError(`target connect_error ${'error' in targetResult ? targetResult.error : ''}`);
	}

	print(`Connecting ${clientCount} clients (${users.length} fixture users, round-robin)...`);
	const clients = await connectClients(target, users, clientCount);
	print(`${clients.length}/${clientCount} connected`);

	const ctx: Context = {
		target,
		playlistId: env.sharedPlaylistId,
		ownerId: env.ownerId,
		deviceId: env.deviceId,
		clients,
		pendingEdits: new Map(),
		pendingCommands: new Map(),
	};

	const startedAt = Date.now();
	if (clients.length > 0) {
		listen(ctx, targetSocket);
		for (const client of clients) client.socket.emit('playlist:join', env.sharedPlaylistId);
		await sleep(JOIN_SETTLE_MS);

		print(`Running the real-time load for ${durationSeconds} s...`);
		const endAt = Date.now() + durationSeconds * 1000;
		await Promise.all(clients.map(client => runClient(ctx, client, endAt)));
	}
	const elapsed = (Date.now() - startedAt) / 1000;

	for (const client of clients) client.socket.disconnect();
	targetSocket?.disconnect();

	const report = {
		target,
		durationSeconds,
		elapsedSeconds: Number(elapsed.toFixed(1)),
		fixtureUsers: users.length,
		clients: clientCount,
		connections: {
			attempted: clientCount,
			ok: clients.length,
			failed: clientCount - clients.length,
			failuresByReason: connectFailures,
			controlTarget: targetSocket ? 'connected' : 'refused',
			joined: clients.filter(c => c.joined).length,
		},
		metrics: {
			connect: summarize(samples.connect),
			editHttp: summarize(samples.editHttp),
			editBroadcast: summarize(samples.editBroadcast),
			controlSuccess: summarize(samples.controlSuccess),
			controlCommand: summarize(samples.controlCommand),
		},
		edits,
		controls,
		timeouts,
		late,
		errors,
		timeoutMs: TIMEOUT_MS,
	};
	await writeFile(out, `${JSON.stringify(report, null, 2)}\n`);
	print(`Socket report written to ${out}`);

	if (clients.length === 0) {
		printError('No socket client could connect');
		return 1;
	}
	return 0;
}

main().then(
	code => process.exit(code),
	(error: unknown) => {
		printError(`Socket scenario failed: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
);
