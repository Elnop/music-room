import Constants from 'expo-constants';
import { loadScript } from '@/features/user/features/auth/shared/sign-in/lib/loadScript';
import { googleButtonConfiguration } from '@/features/user/features/auth/shared/sign-in/lib/googleButtonConfiguration';
import type { GoogleButtonVariant } from '@/features/user/features/auth/authTypes';
import type {
	GoogleButtonConfiguration,
	GoogleButtonTarget,
} from '@/features/user/features/auth/shared/sign-in/types/googleButtonTypes';

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

type GoogleIdentity = {
	initialize: (config: {
		client_id: string;
		callback: (response: { credential?: string }) => void;
		ux_mode: 'popup';
		auto_select: boolean;
	}) => void;
	renderButton: (target: GoogleButtonTarget, config: GoogleButtonConfiguration) => void;
};

type Listener = () => void;

const WEB_CLIENT_ID: string | undefined =
	Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
	process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let initialized = false;
let pendingCredential: string | null = null;
const rendered: Listener[] = [];
let clicked: Listener | null = null;

function receiveCredential({ credential }: { credential?: string }): void {
	if (!credential) return;
	pendingCredential = credential;
	(clicked ?? rendered[rendered.length - 1])?.();
}

async function loadIdentity(): Promise<GoogleIdentity> {
	if (!WEB_CLIENT_ID) {
		throw new Error(
			'Google Sign-In is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.'
		);
	}
	await loadScript(GIS_SCRIPT);
	const identity = (globalThis as { google?: { accounts?: { id?: GoogleIdentity } } }).google
		?.accounts?.id;
	if (!identity) throw new Error('Google Identity Services did not start');
	if (!initialized) {
		identity.initialize({
			client_id: WEB_CLIENT_ID,
			callback: receiveCredential,
			ux_mode: 'popup',
			auto_select: false,
		});
		initialized = true;
	}
	return identity;
}

export function configureGoogleSignIn(): void {}

export async function renderGoogleButton(
	target: GoogleButtonTarget,
	variant: GoogleButtonVariant,
	onCredential: () => void
): Promise<() => void> {
	const identity = await loadIdentity();
	function listener(): void {
		onCredential();
	}
	identity.renderButton(
		target,
		googleButtonConfiguration(target, variant, () => {
			clicked = listener;
		})
	);
	rendered.push(listener);
	return () => {
		const index = rendered.indexOf(listener);
		if (index >= 0) rendered.splice(index, 1);
		if (clicked === listener) clicked = null;
	};
}

export async function signInWithGoogle(): Promise<string> {
	const credential = pendingCredential;
	pendingCredential = null;
	if (credential) return credential;
	await loadIdentity();
	throw new Error('Google Sign-In starts from the Google button in the browser');
}
