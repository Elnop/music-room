// Browser variant: Google Identity Services. Only its rendered button yields an ID token
// reliably (One Tap is throttled after a dismissal), so a sign-in starts from a click on it.
import Constants from 'expo-constants';
import { loadScript } from '@/features/auth/utils/loadScript';
import type { GoogleButtonVariant } from '@/features/auth/types';

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

/** The DOM node a react-native-web `View` renders. */
export interface GoogleButtonTarget {
	offsetWidth: number;
}

interface ButtonConfiguration {
	type: 'standard';
	theme: 'outline';
	size: 'large' | 'medium';
	text: 'continue_with';
	shape: 'rectangular';
	logo_alignment: 'center' | 'left';
	locale: string;
	width?: number;
	click_listener: () => void;
}

interface GoogleIdentity {
	initialize: (config: {
		client_id: string;
		callback: (response: { credential?: string }) => void;
		ux_mode: 'popup';
		auto_select: boolean;
	}) => void;
	renderButton: (target: GoogleButtonTarget, config: ButtonConfiguration) => void;
}

type Listener = () => void;

const WEB_CLIENT_ID: string | undefined =
	Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
	process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let initialized = false;
let pendingCredential: string | null = null;
/** Screens stay mounted under the one on top: the clicked button, else the latest, owns a credential. */
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

/** The button takes 200 to 400 pixels. */
function formWidth(target: GoogleButtonTarget): number {
	return Math.min(400, Math.max(200, Math.round(target.offsetWidth)));
}

export function configureGoogleSignIn(): void {}

/** Resolves with the release to call on unmount; `onCredential` then calls `signInWithGoogle`. */
export async function renderGoogleButton(
	target: GoogleButtonTarget,
	variant: GoogleButtonVariant,
	onCredential: () => void
): Promise<() => void> {
	const identity = await loadIdentity();
	const listener: Listener = () => onCredential();
	const form = variant === 'form';
	identity.renderButton(target, {
		type: 'standard',
		theme: 'outline',
		size: form ? 'large' : 'medium',
		text: 'continue_with',
		shape: 'rectangular',
		logo_alignment: form ? 'center' : 'left',
		locale: 'fr',
		...(form ? { width: formWidth(target) } : {}),
		click_listener: () => {
			clicked = listener;
		},
	});
	rendered.push(listener);
	return () => {
		const index = rendered.indexOf(listener);
		if (index >= 0) rendered.splice(index, 1);
		if (clicked === listener) clicked = null;
	};
}

/** Hands over the credential the Google button has just received; it serves once. */
export async function signInWithGoogle(): Promise<string> {
	const credential = pendingCredential;
	pendingCredential = null;
	if (credential) return credential;
	await loadIdentity();
	throw new Error('Google Sign-In starts from the Google button in the browser');
}
