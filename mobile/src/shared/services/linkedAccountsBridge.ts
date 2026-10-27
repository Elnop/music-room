import type { RefCallback } from 'react';
import type { View } from 'react-native';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export type OAuthProvider = 'google' | 'facebook';

/** The browser shows Google's own button: a form-wide one, or a compact one in a row. */
export type GoogleButtonVariant = 'form' | 'row';

/** Set on the web only: the `View` the Google button renders into. */
export type GoogleButtonSlot = RefCallback<View>;

export interface LinkedProvider {
	type: 'password' | OAuthProvider;
	connectedAt: string;
	isPrimary: boolean;
}

interface LinkedAccountsBridge {
	useLinkedProviders: () => UseQueryResult<LinkedProvider[], Error>;
	useLinkProvider: () => UseMutationResult<unknown, Error, OAuthProvider>;
	useUnlinkProvider: () => UseMutationResult<unknown, Error, OAuthProvider>;
	useGoogleButton: (
		onCredential: () => void,
		variant: GoogleButtonVariant
	) => GoogleButtonSlot | undefined;
}

let bridge: LinkedAccountsBridge | null = null;

export function registerLinkedAccountsBridge(impl: LinkedAccountsBridge): void {
	bridge = impl;
}

export function useLinkedProviders(): UseQueryResult<LinkedProvider[], Error> {
	if (!bridge) {
		throw new Error('LinkedAccountsBridge has not been registered');
	}
	return bridge.useLinkedProviders();
}

export function useLinkProvider(): UseMutationResult<unknown, Error, OAuthProvider> {
	if (!bridge) {
		throw new Error('LinkedAccountsBridge has not been registered');
	}
	return bridge.useLinkProvider();
}

export function useUnlinkProvider(): UseMutationResult<unknown, Error, OAuthProvider> {
	if (!bridge) {
		throw new Error('LinkedAccountsBridge has not been registered');
	}
	return bridge.useUnlinkProvider();
}

export function useGoogleButton(
	onCredential: () => void,
	variant: GoogleButtonVariant
): GoogleButtonSlot | undefined {
	if (!bridge) {
		throw new Error('LinkedAccountsBridge has not been registered');
	}
	return bridge.useGoogleButton(onCredential, variant);
}
