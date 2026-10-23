import { beforeEach, describe, expect, it, vi } from 'vitest';

interface SentMessage {
	from: string;
	to: string;
	subject: string;
	html: string;
	text: string;
}

const { createTransport, sendMail } = vi.hoisted(() => ({
	createTransport: vi.fn<(options: unknown) => { sendMail: unknown }>(),
	sendMail: vi.fn<(message: SentMessage) => Promise<{ messageId: string }>>(),
}));

vi.mock('nodemailer', () => ({
	default: { createTransport },
}));

type MailService = typeof import('@/features/mail/services/mail.service.js');
type MailConfig = typeof import('@/features/mail/mail.config.js');

const TO = 'listener@example.com';
const CODE = '123456';

let mail: MailService;
let config: MailConfig;

function sentMessage(): SentMessage {
	expect(sendMail).toHaveBeenCalledTimes(1);
	return sendMail.mock.calls[0][0];
}

describe('mail.service', () => {
	beforeEach(async () => {
		vi.resetModules();
		sendMail.mockReset().mockResolvedValue({ messageId: 'test' });
		createTransport.mockReset().mockReturnValue({ sendMail });
		mail = await import('@/features/mail/services/mail.service.js');
		config = await import('@/features/mail/mail.config.js');
	});

	it('creates the Gmail transport once from transportConfig', async () => {
		await mail.sendVerificationEmail(TO, CODE, 15);
		await mail.sendPasswordResetEmail(TO, CODE, 15);

		expect(createTransport).toHaveBeenCalledTimes(1);
		expect(createTransport).toHaveBeenCalledWith(config.transportConfig);
		expect(config.transportConfig).toMatchObject({
			service: 'gmail',
			auth: { user: 'test@example.com', pass: 'test-app-password' },
		});
	});

	it('sends through the SMTP_HOST server without auth when it is set', async () => {
		vi.stubEnv('SMTP_HOST', 'localhost');
		vi.stubEnv('SMTP_PORT', '2525');
		vi.resetModules();
		try {
			mail = await import('@/features/mail/services/mail.service.js');
			config = await import('@/features/mail/mail.config.js');
			await mail.sendVerificationEmail(TO, CODE, 15);

			expect(createTransport).toHaveBeenCalledWith({
				host: 'localhost',
				port: 2525,
				secure: false,
				ignoreTLS: true,
			});
			expect(sentMessage().from).toBe('Zumik <test@example.com>');
		} finally {
			vi.unstubAllEnvs();
		}
	});

	it('sends the verification code', async () => {
		await mail.sendVerificationEmail(TO, CODE, 15);

		const message = sentMessage();
		expect(message.to).toBe(TO);
		expect(message.from).toBe('Zumik <test@example.com>');
		expect(message.subject).toContain('Verify Your Zumik Account');
		expect(message.html).toContain(CODE);
		expect(message.html).toContain('15 minutes');
		expect(message.text).toContain(CODE);
		expect(message.text).toContain('15 minutes');
	});

	it('sends the password reset code', async () => {
		await mail.sendPasswordResetEmail(TO, CODE, 15);

		const message = sentMessage();
		expect(message.to).toBe(TO);
		expect(message.from).toBe('Zumik <test@example.com>');
		expect(message.subject).toContain('Reset Your Zumik Password');
		expect(message.html).toContain(CODE);
		expect(message.html).toContain('15 minutes');
		expect(message.text).toContain(CODE);
		expect(message.text).toContain('15 minutes');
	});

	it.each([
		['sendVerificationEmail', (m: MailService) => m.sendVerificationEmail(TO, CODE, 15)],
		['sendPasswordResetEmail', (m: MailService) => m.sendPasswordResetEmail(TO, CODE, 15)],
	])('%s propagates a transport failure', async (_name, send) => {
		const failure = new Error('SMTP down');
		sendMail.mockRejectedValue(failure);

		await expect(send(mail)).rejects.toBe(failure);
	});
});
